# Birthday Invite — Final v3

Recipient invite + local dashboard.

### Changes in this build
- Slide 1: single heading/subheading; heart between them removed; tighter hint spacing; NO still dodges.
- YES dodges exactly once on first touch/hover, then becomes clickable.
- Slide 2: single heading; tighter heading/button spacing.
- Slide 3: single heading/subheading; date picker removed; local hugging-couple image; time/place/address/location form retained.
- Slide 4: single heading/subheading; feeling choices; clicking any feeling automatically opens the next slide.
- Slide 5 and 6 retained from the requested invite flow.
- No visible 1/2/3 step counter.
- Dashboard included.

### Local test
```bash
python -m http.server 8000
```
Open `http://localhost:8000/`.
Dashboard: `http://localhost:8000/dashboard.html`.

The `$499` button is presentation-only in this build; it does not charge or open a payment gateway.
