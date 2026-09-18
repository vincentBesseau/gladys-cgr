# CGR

Movies currently playing at your CGR cinema, as a dashboard widget, with a
scene trigger for when a new film joins the program.

## Important: unofficial integration

This integration reads the showtimes data that **cgrcinemas.fr already
serves publicly to any visitor** of its site — the same content you would
see by opening your cinema's page in a browser, nothing more. It is not
developed, endorsed, or affiliated with CGR. CGR can change its site at any
time and break this integration without notice.

No paid API, no credential extracted from an app, no bypass of anti-bot
protection is used: only the public endpoints the site already uses for
itself.

## Configuration

1. Open the integration's **Configuration** tab.
2. Run the **Find my cinema** action: leave the field empty to list the 5 CGR
   cinemas nearest your Gladys house (if it has a location set), or type a
   city to search across all of them. The result is shown under the button
   as `Cinema name — City (12.3 km) (ID: P0905)` (the distance only appears
   for a proximity search).
3. Copy the ID of your cinema into the **Cinema ID** field, then save.

If no Gladys house has a location set, leaving the field empty lists every
CGR cinema instead (fallback behavior).

Add the integration's **now_playing** widget to a Gladys dashboard to see the
films playing today at that cinema: poster, a booking link, today's
showtimes (time and version, VF/VO/VOST) and, when cgrcinemas.fr has one, a
trailer link.

## Scene trigger

The integration also declares a **new_film** scene trigger: create a scene
with this trigger to react when a film not seen before appears in the
program (send a message, for example). The trigger exposes the film's
title, release date, today's showtimes and booking link as scene variables.
The integration checks for new films twice a day.

## Known limitations (v1)

- One cinema at a time per installation of the integration.
- Only today's films and showtimes (no view of tomorrow or later days).
- The cinema list is a hand-maintained static list (see the repository's
  README): a brand-new CGR cinema may not appear in it yet.

## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys interface (or `docker logs` on the host) with `LOG_LEVEL=debug` for
full detail.
