import json
import os
import resource
import signal
import shutil
import subprocess
import sys
import tempfile
import time

OUTPUT_LIMIT = 65536


def drop_to_sandbox_user(uid=65534):
    os.setgroups([])
    os.setgid(uid)
    os.setuid(uid)


def set_runtime_limits(uid):
    resource.setrlimit(resource.RLIMIT_CPU, (5, 6))
    resource.setrlimit(resource.RLIMIT_FSIZE, (OUTPUT_LIMIT, OUTPUT_LIMIT))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    # Give each test a different UID so one test cannot inspect a later test's process.
    drop_to_sandbox_user(uid)


def read_output(file):
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return file.read(OUTPUT_LIMIT + 1).decode("utf-8", errors="replace"), size


def run_program(command, input_text, time_limit_ms, sandbox_uid):
    with tempfile.TemporaryFile() as stdout_file, tempfile.TemporaryFile() as stderr_file:
        started = time.monotonic()
        try:
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=stdout_file,
                stderr=stderr_file,
                start_new_session=True,
                preexec_fn=lambda: set_runtime_limits(sandbox_uid),
            )
            try:
                process.communicate(
                    input=input_text.encode("utf-8"),
                    timeout=time_limit_ms / 1000,
                )
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                return {
                    "status": "tle",
                    "timeMs": max(1, round((time.monotonic() - started) * 1000)),
                }
        except (OSError, ValueError) as error:
            return {"status": "runtime", "error": str(error)}

        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass

        elapsed = max(1, round((time.monotonic() - started) * 1000))
        output, output_size = read_output(stdout_file)
        error_text, _ = read_output(stderr_file)
        if output_size >= OUTPUT_LIMIT:
            return {"status": "ole", "timeMs": elapsed}
        if process.returncode != 0:
            return {
                "status": "runtime",
                "timeMs": elapsed,
                "error": error_text[:2000] or f"Program exited with code {process.returncode}.",
            }
        return {"status": "ok", "timeMs": elapsed, "output": output}


def normalized(text):
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").split("\n")).strip()


def output_hash(text):
    value = normalized(text)
    result = 0x811C9DC5
    encoded = value.encode("utf-16-le", errors="surrogatepass")
    for index in range(0, len(encoded), 2):
        result ^= int.from_bytes(encoded[index:index + 2], "little")
        result = (result * 0x01000193) & 0xFFFFFFFF
    return f"{result:08x}"


def finish(verdict, total, passed=0, failed=None, elapsed=0, message=None, details=None):
    usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    return {
        "verdict": verdict,
        "testFailed": failed,
        "passedTests": passed,
        "totalTests": total,
        "timeMs": elapsed,
        "memoryKb": max(0, int(usage.ru_maxrss)),
        "errorMessage": message,
        "sampleFailedDetails": details,
    }


def main():
    request = json.load(sys.stdin)
    code = request["code"]
    language = request["language"]
    tests = request["tests"]
    sample_count = request["sampleCount"]
    time_limit_ms = request["timeLimitMs"]
    total = len(tests)

    directory = tempfile.mkdtemp(prefix="schoolforces-")
    try:
        os.chmod(directory, 0o777)
        source = os.path.join(directory, {
            "cpp": "main.cpp",
            "python": "main.py",
            "javascript": "main.js",
        }[language])
        with open(source, "w", encoding="utf-8") as source_file:
            source_file.write(code)
        os.chmod(source, 0o644)

        if language == "cpp":
            binary = os.path.join(directory, "solution")
            compilation_command = ["g++", "-std=c++17", "-O2", "-pipe", source, "-o", binary]
            command = [binary]
        elif language == "python":
            compilation_command = [
                "python3", "-c",
                "import pathlib,sys; compile(pathlib.Path(sys.argv[1]).read_text(), sys.argv[1], 'exec')",
                source,
            ]
            command = ["python3", source]
        else:
            compilation_command = ["node", "--check", source]
            command = ["node", source]

        try:
            compilation = subprocess.run(
                compilation_command,
                capture_output=True,
                text=True,
                timeout=20,
                preexec_fn=drop_to_sandbox_user,
            )
        except subprocess.TimeoutExpired:
            result = finish("Compilation Error", total, failed=1, message="Compilation timed out.")
            print(json.dumps(result))
            return
        if compilation.returncode != 0:
            result = finish(
                "Compilation Error",
                total,
                failed=1,
                message=compilation.stderr[-4000:] or "Compilation failed.",
            )
            print(json.dumps(result))
            return

        os.chmod(directory, 0o555)
        passed = 0
        max_time = 0
        for index, test in enumerate(tests):
            run = run_program(command, test["input"], time_limit_ms, 65534 + index)
            max_time = max(max_time, run.get("timeMs", 0))
            if run["status"] == "tle":
                result = finish(
                    "Time Limit Exceeded", total, passed, index + 1, max_time,
                    f"Time limit exceeded ({time_limit_ms / 1000:.1f} s).",
                )
                print(json.dumps(result))
                return
            if run["status"] == "ole":
                result = finish(
                    "Output Limit Exceeded", total, passed, index + 1, max_time,
                    f"Output exceeds the {OUTPUT_LIMIT // 1024} KB limit.",
                )
                print(json.dumps(result))
                return
            if run["status"] == "runtime":
                details = None
                if index < sample_count:
                    details = {
                        "input": test["input"],
                        "expected": test.get("output", ""),
                        "actual": f"Runtime Error: {run['error']}",
                    }
                result = finish(
                    "Runtime Error", total, passed, index + 1, max_time,
                    run["error"], details,
                )
                print(json.dumps(result))
                return

            actual = normalized(run["output"])
            expected_hash = test.get("outputHash")
            matches = output_hash(actual) == expected_hash if expected_hash else actual == normalized(test["output"])
            if not matches:
                details = None
                if index < sample_count:
                    details = {
                        "input": test["input"],
                        "expected": test["output"],
                        "actual": run["output"] or "(empty output)",
                    }
                result = finish(
                    "Wrong Answer", total, passed, index + 1, max_time,
                    f"Wrong answer on test {index + 1}.", details,
                )
                print(json.dumps(result))
                return
            passed += 1

        print(json.dumps(finish("Accepted", total, passed, elapsed=max(15, max_time))))
    finally:
        os.chmod(directory, 0o755)
        shutil.rmtree(directory)


try:
    main()
except Exception as error:
    print(json.dumps({"runnerError": str(error)}))
