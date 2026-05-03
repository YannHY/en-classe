#!/bin/zsh
set -euo pipefail

BASE_URL="https://www.ralentirtravaux.com/apps/en-classe"
TARGET_DIR="${1:-$HOME/Documents/Mots-croises}"
BIN_DIR="$HOME/bin"
LAUNCHER_PATH="$BIN_DIR/mots-croises"
ZSHRC_PATH="$HOME/.zshrc"

mkdir -p "$TARGET_DIR/bin" "$TARGET_DIR/js"
mkdir -p "$BIN_DIR"

curl -fsSL "$BASE_URL/bin/mots-croises.js" -o "$TARGET_DIR/bin/mots-croises.js"
curl -fsSL "$BASE_URL/js/crossword-cli-core.js" -o "$TARGET_DIR/js/crossword-cli-core.js"
chmod +x "$TARGET_DIR/bin/mots-croises.js"

cat > "$LAUNCHER_PATH" <<EOF
#!/bin/zsh
node "$TARGET_DIR/bin/mots-croises.js" "\$@"
EOF
chmod +x "$LAUNCHER_PATH"

if [ -f "$ZSHRC_PATH" ]; then
  if ! grep -Fq 'export PATH="$HOME/bin:$PATH"' "$ZSHRC_PATH"; then
    printf '\nexport PATH="$HOME/bin:$PATH"\n' >> "$ZSHRC_PATH"
  fi
else
  printf 'export PATH="$HOME/bin:$PATH"\n' > "$ZSHRC_PATH"
fi

cat <<EOF
CLI installé dans :
$TARGET_DIR

Commandes suivantes :
source "$ZSHRC_PATH"
mots-croises --help
EOF
