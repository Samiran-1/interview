import os
import json
import base64
from livekit import api

api_key = "API76qLXKwcyXJN"
api_secret = "hFK7MZPO0iZVdfglX6k0u6pbhf5VNLu9cNfrssbKUIEA"
room = "test-room"
identity = "test-user"

token = api.AccessToken(api_key, api_secret) \
    .with_identity(identity) \
    .with_grants(api.VideoGrants(room_join=True, room=room)) \
    .to_jwt()

# Decode the payload without verification to see how it's structured
header, payload, signature = token.split(".")
decoded_payload = json.loads(base64.b64decode(payload + "==").decode("utf-8"))
print(json.dumps(decoded_payload, indent=2))
