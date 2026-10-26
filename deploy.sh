#!/bin/bash

# Read the worker code
WORKER_CODE=$(cat src/index.js)

# Create multipart form data with the code
BOUNDARY="------------------------7d159c1a07d2"

# Write the body to a temporary file
TMPBODY=$(mktemp)

cat > "$TMPBODY" << 'BODYEOF'
-BOUNDARY
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{"main_module":"worker.js"}
-BOUNDARY
Content-Disposition: form-data; name="worker.js"; filename="worker.js"
Content-Type: application/javascript

BODYEOF

cat src/index.js >> "$TMPBODY"

cat >> "$TMPBODY" << 'BODYEOF'

-BOUNDARY--
BODYEOF

# Replace BOUNDARY placeholder
sed -i "s/-BOUNDARY/--$BOUNDARY/g" "$TMPBODY"

echo "📤 Ready to deploy. Body file: $TMPBODY"
echo "Size: $(wc -c < $TMPBODY) bytes"

