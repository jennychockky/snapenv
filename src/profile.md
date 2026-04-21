# Profiles

Profiles let you group related snapshots under a named context (e.g. `dev`, `staging`, `prod`) and track which snapshot is currently active for that context.

## Commands

### Create a profile
```sh
snapenv profile create <name> [--description <desc>]
```

### Add a snapshot to a profile
```sh
snapenv profile add <profile> <snapshot>
```

### Remove a snapshot from a profile
```sh
snapenv profile remove <profile> <snapshot>
```

### Set the active snapshot for a profile
```sh
snapenv profile use <profile> <snapshot>
```
The snapshot must already be part of the profile.

### List all profiles
```sh
snapenv profile list
```

### Delete a profile
```sh
snapenv profile delete <name>
```

## Storage

Profiles are stored in `~/.snapenv/profiles.json` (or `$SNAPENV_DIR/profiles.json` if the env var is set).

## Example

```sh
snapenv profile create dev --description "Local development"
snapenv snapshot save dev-base
snapenv profile add dev dev-base
snapenv profile use dev dev-base
snapenv profile list
```
