# Overwatch

A Slack-like dashboard for monitoring notifications from systems and agents across your organization.

## What it does

Events published to a Nostr relay are automatically grouped by their tags into channels. Each tag becomes a channel, so you get a familiar Slack-like layout where conversations are organized by topic. Any system, bot, or agent that publishes to the relay shows up in the right place without any configuration.

The result is a single pane of glass for everything happening in your org -- CI pipelines, monitoring alerts, agent updates, deployment notices -- without running a centralized notification service. Nostr relays handle the transport, and you choose which relays to listen to.

## How it works

- Systems and agents publish events to a Nostr relay with relevant tags
- Overwatch subscribes to the relay and groups incoming events by tag
- Each tag maps to a channel in the sidebar
- Real-time updates stream in over WebSockets

## How it looks
<img width="989" height="1248" alt="image" src="https://github.com/user-attachments/assets/be42f59f-b5fb-4a35-9b6f-183c2d9413bc" />


## Setup

```bash
npm install
npm run dev
```

To point at a specific relay, set `VITE_FORCED_RELAY` in your `.env`:

```
VITE_FORCED_RELAY=wss://your-relay.example.com
```

For Docker:

```bash
docker compose up
```

## Publishing events

Overwatch groups events into channels based on their `t` (hashtag) tags. Any Nostr event with a `t` tag will appear in the corresponding channel. The channel is auto-discovered -- no setup needed on the dashboard side.

The key requirement: include a `["t", "your-channel-name"]` tag on every event you publish.

### Using nak (CLI)

[nak](https://github.com/fiatjaf/nak) is the simplest way to send events from scripts and CI pipelines.

```bash
RELAY="ws://localhost:7777"

# Simple message to the #deployments channel
nak event -t t=deployments \
  -c "v2.4.1 deployed to production. All health checks passing." \
  "$RELAY"

# Multiple tags -- event appears in both #security and #incidents channels
nak event -t t=security -t t=incidents \
  -c "[ALERT] Unusual login activity detected on staging-api-02. Investigating." \
  "$RELAY"

# Using a specific private key (hex nsec) for a bot identity
nak event -t t=engineering --sec <hex-private-key> \
  -c "CI pipeline #1847 passed. Build time: 8m12s. 0 flaky tests." \
  "$RELAY"
```

### JavaScript (Node.js)

Uses [nostr-tools](https://github.com/nbd-wtf/nostr-tools). Install with `npm install nostr-tools`.

```javascript
import { finalizeEvent, generateSecretKey, Relay } from "nostr-tools";

const sk = generateSecretKey(); // or load an existing key
const relay = await Relay.connect("ws://localhost:7777");

const event = finalizeEvent(
  {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["t", "deployments"]],
    content: "v2.4.1 deployed to production. All health checks passing.",
  },
  sk
);

await relay.publish(event);
relay.close();
```

For a long-running agent that publishes to multiple channels:

```javascript
import { finalizeEvent, generateSecretKey, Relay } from "nostr-tools";

const sk = generateSecretKey();
const relay = await Relay.connect("ws://localhost:7777");

function publish(channel, message) {
  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["t", channel]],
      content: message,
    },
    sk
  );
  return relay.publish(event);
}

await publish("engineering", "CI pipeline #1847 passed. Build time: 8m12s.");
await publish("security", "[ALERT] CVE-2026-1847 patch available for OpenSSL 3.x.");
await publish("ai-reports", "[Weekly Digest] Revenue: $2.41M (+8.3% WoW).");

relay.close();
```

### Python

Uses [nostr-sdk](https://rust-nostr.org) (Rust bindings for Python). Install with `pip install nostr-sdk`.

```python
import asyncio
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner, Tag, RelayUrl


async def main():
    keys = Keys.generate()
    signer = NostrSigner.keys(keys)
    client = Client(signer)

    relay_url = RelayUrl.parse("ws://localhost:7777")
    await client.add_relay(relay_url)
    await client.connect()

    builder = EventBuilder.text_note(
        "v2.4.1 deployed to production. All health checks passing."
    ).tags([Tag.hashtag("deployments")])

    output = await client.send_event_builder(builder)
    print(f"Event ID: {output.id.to_bech32()}")
    print(f"Sent to: {output.success}")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
```

For a long-running agent that publishes to multiple channels:

```python
import asyncio
from nostr_sdk import Keys, Client, EventBuilder, NostrSigner, Tag, RelayUrl


async def main():
    keys = Keys.generate()
    signer = NostrSigner.keys(keys)
    client = Client(signer)

    await client.add_relay(RelayUrl.parse("ws://localhost:7777"))
    await client.connect()

    async def publish(channel: str, message: str):
        builder = EventBuilder.text_note(message).tags([Tag.hashtag(channel)])
        await client.send_event_builder(builder)

    await publish("engineering", "CI pipeline #1847 passed. Build time: 8m12s.")
    await publish("security", "[ALERT] CVE-2026-1847 patch available for OpenSSL 3.x.")
    await publish("ai-reports", "[Weekly Digest] Revenue: $2.41M (+8.3% WoW).")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
```

### Event structure reference

The minimum event that Overwatch will pick up and display in a channel:

```json
{
  "kind": 1,
  "content": "Your message text here.",
  "tags": [
    ["t", "channel-name"]
  ],
  "created_at": 1719500000,
  "pubkey": "<32-byte-hex-pubkey>",
  "id": "<sha256-of-serialized-event>",
  "sig": "<schnorr-signature>"
}
```

**Supported event kinds**: 1 (text note), 6 (repost), 7 (reaction), 20 (picture), 21 (video), 22 (short video), 23 (highlight), 1068 (poll), 1111 (comment), 1222 (voice), 30023 (long-form article).

**Tag rules**:
- `["t", "channel-name"]` -- required. This is how events map to channels. Case-insensitive, no `#` prefix.
- Multiple `t` tags are supported -- the event appears in all matching channels.
- Channels are auto-discovered when `VITE_FORCED_RELAY` is set. Otherwise, users create channels manually in the UI and specify which hashtags to watch.

## Credits
Based on [Jumble](https://github.com/CodyTseng/jumble).


## License

MIT
