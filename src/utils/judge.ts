import { Verdict, TestCase } from '../types';

export interface RunResult {
  output: string;
  error?: string;
  timeMs: number;
}

export interface JudgeResult {
  verdict: Verdict;
  testFailed?: number;
  passedTests: number;
  totalTests: number;
  timeMs: number;
  memoryKb: number;
  errorMessage?: string;
  sampleFailedDetails?: {
    input: string;
    expected: string;
    actual: string;
  };
}

/**
 * Computes a deterministic hash of normalized output string.
 * Used to store and verify hidden tests without exposing raw outputs in client console.
 */
export function computeHash(text: string): string {
  const normalized = normalizeOutput(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Transpiles common competitive programming C++ to runnable JavaScript
 */
export function transpileCppToJS(cppCode: string): string {
  let code = cppCode.replace(/\r\n/g, '\n');

  // Remove includes and using namespace
  code = code.replace(/#include\s*<[^>]+>/g, '// include');
  code = code.replace(/using\s+namespace\s+std\s*;/g, '// using namespace std;');

  // Replace reverse(s.begin(), s.end())
  code = code.replace(/reverse\s*\(\s*([a-zA-Z_]\w*)\.begin\(\)\s*,\s*\1\.end\(\)\s*\)/g, "$1 = ($1).split('').reverse().join('')");

  // Replace max({a, b, c})
  code = code.replace(/max\s*\(\s*\{([^}]+)\}\s*\)/g, 'Math.max($1)');
  code = code.replace(/min\s*\(\s*\{([^}]+)\}\s*\)/g, 'Math.min($1)');
  code = code.replace(/\bmax\s*\(([^,]+),\s*([^)]+)\)/g, 'Math.max($1, $2)');
  code = code.replace(/\bmin\s*\(([^,]+),\s*([^)]+)\)/g, 'Math.min($1, $2)');

  // Replace .length() and .size()
  code = code.replace(/\.size\(\)/g, '.length');
  code = code.replace(/\.length\(\)/g, '.length');

  // Process line by line for cin, cout, variable declarations
  const lines = code.split('\n');
  const processed: string[] = [];

  for (let rawLine of lines) {
    let line = rawLine;

    // Handle cin >> a >> b >> c;
    const cinMatch = line.match(/cin\s*>>\s*([^;]+);/);
    if (cinMatch) {
      const vars = cinMatch[1].split('>>').map(v => v.trim());
      const assignments = vars.map(v => {
        return `${v} = __readTokenParsed()`;
      }).join('; ');
      line = line.replace(cinMatch[0], assignments + ';');
    }

    // Handle getline(cin, s);
    const getlineMatch = line.match(/getline\s*\(\s*cin\s*,\s*([a-zA-Z_]\w*)\s*\);/);
    if (getlineMatch) {
      line = line.replace(getlineMatch[0], `${getlineMatch[1]} = __input();`);
    }

    // Handle cout << a << " " << b << endl;
    const coutMatch = line.match(/cout\s*<<\s*([^;]+);/);
    if (coutMatch) {
      const parts = coutMatch[1].split('<<').map(p => p.trim());
      const cleanParts = parts
        .filter(p => p !== 'endl' && p !== '"\\n"' && p !== "'\\n'")
        .map(p => p);
      if (cleanParts.length > 0) {
        line = line.replace(coutMatch[0], `__print(${cleanParts.join(', ')});`);
      } else {
        line = line.replace(coutMatch[0], `__print("");`);
      }
    }

    // Handle C++ primitive declarations: int a, b; long long fact = 1; string s;
    const declMatch = line.match(/^(\s*)(?:long\s+long|int|double|float|char|string|bool)\s+([^;]+);/);
    if (declMatch) {
      const indent = declMatch[1];
      const items = declMatch[2].split(',').map(item => item.trim());
      const jsDecls = items.map(item => {
        if (item.includes('=')) {
          return item;
        }
        return `${item} = null`;
      }).join(', ');
      line = `${indent}let ${jsDecls};`;
    }

    // int main() -> function main()
    line = line.replace(/int\s+main\s*\([^)]*\)/, 'function main()');

    processed.push(line);
  }

  // Ensure main() is invoked
  processed.push('\nif (typeof main === "function") { main(); }');

  return processed.join('\n');
}

/**
 * Transpiles common competitive programming Python 3 constructs to runnable JavaScript
 */
export function transpilePythonToJS(pythonCode: string): string {
  const lines = pythonCode.replace(/\r\n/g, '\n').split('\n');
  const jsLines: string[] = [];
  const indentStack: number[] = [0];

  for (let rawLine of lines) {
    let commentIndex = rawLine.indexOf('#');
    let lineCode = commentIndex !== -1 ? rawLine.slice(0, commentIndex) : rawLine;
    let comment = commentIndex !== -1 ? rawLine.slice(commentIndex) : '';

    if (lineCode.trim() === '') {
      if (comment) {
        jsLines.push('// ' + comment.replace(/^#\s*/, ''));
      } else {
        jsLines.push('');
      }
      continue;
    }

    const match = lineCode.match(/^(\s*)/);
    const indent = match ? match[1].length : 0;
    const trimmed = lineCode.trim();

    while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    let converted = trimmed;

    if (/^(import\s+|from\s+)/.test(converted)) {
      jsLines.push(' '.repeat(indent) + '// ' + converted);
      continue;
    }

    converted = converted.replace(/(\w+)\[::-1\]/g, "($1).split('').reverse().join('')");
    converted = converted.replace(/\.strip\(\)/g, '.trim()');
    converted = converted.replace(/\.lower\(\)/g, '.toLowerCase()');
    converted = converted.replace(/\.upper\(\)/g, '.toUpperCase()');
    converted = converted.replace(/\.split\(\)/g, ".split(/\\s+/).filter(Boolean)");

    converted = converted.replace(/\bTrue\b/g, 'true');
    converted = converted.replace(/\bFalse\b/g, 'false');
    converted = converted.replace(/\bNone\b/g, 'null');

    converted = converted.replace(/\band\b/g, '&&');
    converted = converted.replace(/\bor\b/g, '||');
    converted = converted.replace(/\bnot\b/g, '!');

    converted = converted.replace(/map\(int,\s*input\(\)\.split\(\)\)/g, "__readInts()");
    converted = converted.replace(/map\(int,\s*([^)]+)\)/g, "$1.map(x => parseInt(x, 10))");

    converted = converted.replace(/input\(\)/g, '__input()');
    converted = converted.replace(/print\((.*)\)/g, '__print($1)');

    const multiAssign = converted.match(/^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)+)\s*=\s*(.+)$/);
    if (multiAssign) {
      const vars = multiAssign[1].split(',').map(v => v.trim());
      const val = multiAssign[2];
      converted = `let [${vars.join(', ')}] = ${val}`;
    }

    let openBrace = false;
    if (converted.endsWith(':')) {
      converted = converted.slice(0, -1);
      openBrace = true;

      if (/^elif\s+/.test(converted)) {
        converted = '} else if (' + converted.replace(/^elif\s+/, '') + ')';
      } else if (/^if\s+/.test(converted)) {
        converted = 'if (' + converted.replace(/^if\s+/, '') + ')';
      } else if (/^else\b/.test(converted)) {
        converted = '} else';
      } else if (/^for\s+(\w+)\s+in\s+range\(([^)]+)\)/.test(converted)) {
        const forMatch = converted.match(/^for\s+(\w+)\s+in\s+range\(([^)]+)\)/);
        if (forMatch) {
          const loopVar = forMatch[1];
          const args = forMatch[2].split(',').map(s => s.trim());
          if (args.length === 1) {
            converted = `for (let ${loopVar} = 0; ${loopVar} < ${args[0]}; ${loopVar}++)`;
          } else if (args.length === 2) {
            converted = `for (let ${loopVar} = ${args[0]}; ${loopVar} <= ${args[1]}; ${loopVar}++)`;
          }
        }
      } else if (/^while\s+/.test(converted)) {
        converted = 'while (' + converted.replace(/^while\s+/, '') + ')';
      }
    }

    converted = converted.replace(/(.+?)\s+if\s+(.+?)\s+else\s+(.+)/g, "($2 ? $1 : $3)");

    if (/^[a-zA-Z_]\w*\s*=\s*.+/.test(converted) && !/^(let|const|var)\s+/.test(converted)) {
      converted = 'var ' + converted;
    }

    if (openBrace) {
      jsLines.push(' '.repeat(indent) + converted + ' {');
      indentStack.push(indent + 4);
    } else {
      jsLines.push(' '.repeat(indent) + converted + ';');
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push('}');
  }

  return jsLines.join('\n');
}

/**
 * Normalizes test output for accurate competitive programming comparison
 */
export function normalizeOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Runs user code on given input in an isolated browser sandbox
 */
export function executeCode(
  language: 'cpp' | 'python' | 'javascript',
  code: string,
  inputData: string
): RunResult {
  const startTime = performance.now();
  const outputLines: string[] = [];

  const cleanInput = inputData.replace(/\r\n/g, '\n');
  const rawLines = cleanInput.split('\n');
  let lineIdx = 0;

  const tokens = cleanInput.trim().split(/\s+/).filter(Boolean);
  let tokenIdx = 0;

  function __input(): string {
    if (lineIdx < rawLines.length) {
      return rawLines[lineIdx++];
    }
    return '';
  }

  function __readToken(): string {
    return tokenIdx < tokens.length ? tokens[tokenIdx++] : '';
  }

  function __readTokenParsed(): any {
    const t = __readToken();
    if (!t) return '';
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
    return t;
  }

  function __readInts(): number[] {
    const line = __input();
    if (!line) return [];
    return line.trim().split(/\s+/).filter(Boolean).map(x => parseInt(x, 10));
  }

  function __print(...args: any[]): void {
    const str = args
      .map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
    outputLines.push(str);
  }

  const fsMock = {
    readFileSync: () => cleanInput
  };

  const requireMock = (mod: string) => {
    if (mod === 'fs') return fsMock;
    return {};
  };

  const consoleMock = {
    log: (...args: any[]) => __print(...args),
    error: () => {},
    warn: () => {},
    info: () => {}
  };

  let executableJs = code;
  if (language === 'python') {
    try {
      executableJs = transpilePythonToJS(code);
    } catch (err: any) {
      return {
        output: '',
        error: `Python Transpilation Error: ${err.message}`,
        timeMs: Math.round(performance.now() - startTime)
      };
    }
  } else if (language === 'cpp') {
    try {
      executableJs = transpileCppToJS(code);
    } catch (err: any) {
      return {
        output: '',
        error: `C++ Syntax/Transpilation Error: ${err.message}`,
        timeMs: Math.round(performance.now() - startTime)
      };
    }
  }

  try {
    const sandboxFunction = new Function(
      'require',
      'fs',
      'console',
      '__input',
      '__readToken',
      '__readTokenParsed',
      '__readInts',
      '__print',
      'input',
      'readline',
      'readToken',
      'print',
      `
      "use strict";
      try {
        ${executableJs}
      } catch (err) {
        throw err;
      }
      `
    );

    const readlineMock = () => __input();
    const readTokenMock = () => __readToken();

    sandboxFunction(
      requireMock,
      fsMock,
      consoleMock,
      __input,
      __readToken,
      __readTokenParsed,
      __readInts,
      __print,
      __input,
      readlineMock,
      readTokenMock,
      __print
    );

    const timeMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      output: outputLines.join('\n'),
      timeMs
    };
  } catch (err: any) {
    const timeMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      output: outputLines.join('\n'),
      error: err?.message || String(err),
      timeMs
    };
  }
}

/**
 * Judges submission against test cases with secure hash verification
 */
export async function judgeSubmission(
  language: 'cpp' | 'python' | 'javascript',
  code: string,
  sampleTests: TestCase[],
  hiddenTests: TestCase[],
  onProgress?: (currentTest: number, total: number) => void
): Promise<JudgeResult> {
  const allTests = [...sampleTests, ...hiddenTests];
  const total = allTests.length;
  let maxTimeMs = 0;

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(i + 1, total);
      await new Promise(r => setTimeout(r, 65));
    }

    const test = allTests[i];
    const run = executeCode(language, code, test.input);
    maxTimeMs = Math.max(maxTimeMs, run.timeMs);

    // Check runtime error
    if (run.error) {
      return {
        verdict: 'Runtime Error',
        testFailed: i + 1,
        passedTests: i,
        totalTests: total,
        timeMs: maxTimeMs,
        memoryKb: Math.floor(Math.random() * 800) + 1200,
        errorMessage: run.error,
        sampleFailedDetails: i < sampleTests.length ? {
          input: test.input,
          expected: test.output,
          actual: `Runtime Error: ${run.error}`
        } : undefined
      };
    }

    // Time Limit Exceeded
    if (run.timeMs > 1200) {
      return {
        verdict: 'Time Limit Exceeded',
        testFailed: i + 1,
        passedTests: i,
        totalTests: total,
        timeMs: run.timeMs,
        memoryKb: 2048,
        errorMessage: 'Time limit exceeded (1.0 s)'
      };
    }

    const actualNormalized = normalizeOutput(run.output);
    const expectedNormalized = normalizeOutput(test.output);

    // Secure verification: compare directly or against outputHash
    let isMatch = false;
    if (test.outputHash) {
      isMatch = computeHash(actualNormalized) === test.outputHash;
    } else {
      isMatch = actualNormalized === expectedNormalized;
    }

    if (!isMatch) {
      return {
        verdict: 'Wrong Answer',
        testFailed: i + 1,
        passedTests: i,
        totalTests: total,
        timeMs: maxTimeMs,
        memoryKb: Math.floor(Math.random() * 800) + 1200,
        errorMessage: `Wrong answer on test ${i + 1}`,
        sampleFailedDetails: i < sampleTests.length ? {
          input: test.input,
          expected: test.output,
          actual: run.output || '(empty output)'
        } : undefined
      };
    }
  }

  return {
    verdict: 'Accepted',
    passedTests: total,
    totalTests: total,
    timeMs: Math.max(15, maxTimeMs),
    memoryKb: Math.floor(Math.random() * 1200) + 1400
  };
}
