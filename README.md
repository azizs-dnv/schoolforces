# SchoolForces

SchoolForces is a programming contest platform for school students, featuring coding problems, contests, ratings, and leaderboards.

## Run on a Local Network (LAN)

The computer running SchoolForces acts as the local server. Students and the teacher connect to it using a browser on the same network. Application data is shared and saved in `.data/schoolforces.json` on the server computer.

```bash
npm install
cp .env.example .env
```

Edit `.env` and replace `TEACHER_PASSWORD` with a unique password of at least 12 characters. Start the server:

```bash
npm run lan
```

On the server computer, open `http://localhost:3000`. To connect from another device, find the server computer's local IP address and open `http://SERVER-IP:3000` (for example, `http://192.168.1.25:3000`). Allow Node.js through the computer's firewall on the private network if prompted. Do not expose this server to the public internet.

The teacher signs in with `TEACHER_PASSWORD` and creates student accounts in the teacher panel. Student passwords are stored as salted hashes. Sessions expire when the server restarts or after 12 hours.

To stop the server, press `Ctrl+C`. Keep `.data` to preserve users, contests, problems, and submissions. Back it up regularly. Deleting `.data` resets the shared application data.

## Important Limitations

This is a LAN classroom project, not a production Codeforces replacement. Solution execution and verdict generation still happen in the browser, so students can inspect or alter the judge and contest results. Use it for supervised practice, not high-stakes competitions. The server uses HTTP; only use it on a trusted private network and do not forward its port to the internet.

## Development

`npm run dev` starts the Vite frontend for UI work. Use `npm run lan` to run the complete application with shared server data.

## License

This project is licensed under the [Apache License 2.0](./LICENSE).

## Author

[Aziz Sadonov](https://github.com/azizs-dnv)
