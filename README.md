# snapenv

> CLI tool to snapshot and restore local environment variable sets across projects

## Installation

```bash
npm install -g snapenv
```

## Usage

Save and restore named environment variable snapshots with ease.

```bash
# Save current environment as a named snapshot
snapenv save myproject-dev

# List all saved snapshots
snapenv list

# Restore a snapshot
snapenv restore myproject-dev

# Delete a snapshot
snapenv delete myproject-dev
```

Snapshots are stored locally in `~/.snapenv/` as encrypted JSON files, keeping your secrets off version control.

```bash
# Export a snapshot to a .env file
snapenv export myproject-dev --output .env

# Import from an existing .env file
snapenv import myproject-dev --input .env
```

## Requirements

- Node.js >= 16

## License

MIT © [snapenv contributors](https://github.com/snapenv/snapenv)