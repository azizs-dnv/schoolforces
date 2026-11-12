# SchoolForces

SchoolForces is a programming contest platform for school students, featuring coding problems, contests, ratings, and leaderboards.

## Run on a Local Network (LAN)

The computer running SchoolForces acts as the local server. Students and the teacher connect to it using a browser on the same network. Application data is shared and saved in the SQLite database `.data/schoolforces.sqlite` on the server computer. Users, contests, problems, submissions, and teacher settings are saved there.

Student profiles include a rating history chart, global rating place, and contest placements. Ratings are updated when a contest finishes, based on the standings among students who submitted; the rating change and placement history are saved with the student account. This is an Elo-style approximation, not Codeforces' exact rating formula.

```bash
npm install
cp .env.example .env
```

Edit `.env` and replace `TEACHER_PASSWORD` with a unique password of at least 12 characters. Start the server:

```bash
npm run judge:build
npm run lan
```

The judge image needs to be built once on the server computer. Install Docker or Podman first; if using Podman, set `JUDGE_RUNTIME=podman` in `.env` and build it with `podman build -f Dockerfile.judge -t schoolforces-judge:local .`. Every submitted solution is compiled/run by the server in a restricted container, and both sample and hidden tests are checked against the problem's saved expected outputs. Hidden tests are not sent to student browsers. C++17, Python 3, and JavaScript are supported.

On the server computer, open `http://localhost:3000`. To connect from another device, find the server computer's local IP address and open `http://SERVER-IP:3000` (for example, `http://192.168.1.25:3000`). Allow Node.js through the computer's firewall on the private network if prompted. Do not expose this server to the public internet.

The teacher signs in with `TEACHER_PASSWORD` and creates student accounts in the teacher panel. Student passwords are stored as salted hashes. Sessions are stored in the local database and expire after 12 hours, including across server restarts.

To stop the server, press `Ctrl+C`. Keep `.data` to preserve users, contests, problems, and submissions. Back up the database while the server is stopped. If `.data/schoolforces.json` exists from an older version, it is imported automatically the first time the SQLite database starts; the JSON file is left untouched. Deleting `.data` resets the shared application data.

## Important Limitations

This is a LAN classroom project, not a production Codeforces replacement. The judge runs untrusted submissions in restricted containers, but this is not a guarantee of security against every container escape or denial-of-service technique. Use it for supervised practice, not high-stakes competitions. The server uses HTTP; only use it on a trusted private network and do not forward its port to the internet.

## Development

`npm run dev` starts the Vite frontend for UI work. Use `npm run lan` to run the complete application with shared server data.

## License

This project is licensed under the [Apache License 2.0](./LICENSE).

## Author

[Aziz Sadonov](https://github.com/azizs-dnv)
