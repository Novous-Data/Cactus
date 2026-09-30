# Windowsill Cactus

A real-time cactus care game. A cartoon baby cactus lives on a realistic windowsill, and the view
through the window is a real photograph chosen to match the weather outside your actual window.

- **Pick a baby cactus**: Golden Barrel, Bunny Ears, Saguaro, Moon Cactus, Old Lady, or Christmas Cactus.
  Each has its own light and water needs, growth speed, and bloom season.
- **Real time, day by day**: every real day is a day on the sill. Soil dries, light accumulates, and the
  plant grows even while the page is closed. Coming back shows a "welcome back" report and fills a journal.
- **Real weather, real photos**: 16 real photographs (sunny, partly cloudy, overcast, autumn, haze, rain,
  thunderstorm, snow, fog, sunset, dusk, night, rainy night) are cross-faded to match live conditions and
  the real sun position for your location. Rain, refracting raindrops on the glass, snow, fog, frost and
  lightning are animated over the photo.
- **Cartoon tools**: watering can, moisture meter, pot turning, cactus food, cotton swab for mealybugs,
  mister, glass cloth, grow lamp, and repotting. Tap a tool to use it or drag it onto the cactus.

## How live weather works

Published artifacts cannot make network requests, so live conditions come from the free
**AccuWeather connector** for claude.ai (Settings → Connectors → AccuWeather). The page asks for
permission on first use, reads the connector's tool schema at runtime, and parses the reply
defensively. Without the connector the sky can be set by hand from the weather panel, and time of
day, sunrise and sunset are still computed for your location.

## Saving

Progress saves to the browser and, when the page runs inside Claude, to the viewer's private
per-user document (`data/users/<id>/save`) so it follows you between devices.

## Project layout

```
src/index.html      page template (title, fonts, layer structure, HUD)
src/style.css       all styles
src/js/*.js         modules, concatenated in the order listed in build.mjs
  util data sun weather sim store room fx plant items ui audio main
photos/             the window views (JPEG, ~1.8 MB total)
build.mjs           inlines CSS + JS into dist/windowsill-cactus.html (+ preview.html)
tools/shoot.cjs     Playwright screenshots of seeded game states
tools/play.cjs      scripted play-through (onboarding, tools, panels)
tools/live-test.cjs live-weather + cloud-save paths against a mocked window.claude
```

Build and preview locally:

```
node build.mjs
python3 -m http.server 8765        # then open http://127.0.0.1:8765/preview.html
```

Add `#debug` to the URL to expose `window.__cactus` for poking at game state.

## Photo credits

All photos come from the [Open Images](https://storage.googleapis.com/openimages/web/index.html)
dataset and are licensed [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/). They were resized
and lightly colour-adjusted, and are tinted in-game for time of day.

| File | Photo | Author |
| --- | --- | --- |
| clear.jpg | [Menai Bridge](https://www.flickr.com/photos/grish616/15262080019) | Rebecca Boardman |
| farm.jpg | [Train ride - WV](https://www.flickr.com/photos/pbmcintyre222/9848069796) | Patti Bean McIntyre |
| partly.jpg | [Begumpur, Matlab North, Chandpur](https://www.flickr.com/photos/crysisrubel/15041368608) | Crysis Rubel |
| hazy.jpg | [Magical neolithics](https://www.flickr.com/photos/73man/7507694230) | Eoin O'Mahony |
| cloudy.jpg | [distant sheep near Trawden](https://www.flickr.com/photos/juliagillen/4760635714) | Julia Gillen |
| cloudy_fall.jpg | [House overlooking Cooks Bridge marsh](https://www.flickr.com/photos/nhoulihan/3652594458) | InAweofGod'sCreation |
| rain.jpg | [Afternoon soaking downpour](https://www.flickr.com/photos/nordique/7251908904) | Peter Stevens |
| storm.jpg | [Scottsdale Microburst](https://www.flickr.com/photos/athomeinscottsdale/3742762544) | Dru Bloomfield |
| lightning.jpg | [Lightning over Somerset County, New Jersey](https://www.flickr.com/photos/quintanomedia/14706711086) | Anthony Quintano |
| snow.jpg | [Winter Storm](https://www.flickr.com/photos/clearlyambiguous/4337896326) | Scott Robinson |
| snow_sun.jpg | [snOwMaGeddon 2010: Sunday](https://www.flickr.com/photos/blakespot/4338003438) | Blake Patterson |
| fog.jpg | [IMG_2579](https://www.flickr.com/photos/jumpyjodes/7304138512) | Jodie Wilson |
| golden.jpg | [Streaks.](https://www.flickr.com/photos/florianplag/5617808014) | Florian Plag |
| dusk.jpg | [Venus at sunrise](https://www.flickr.com/photos/ikewinski/8106387198) | Mike Lewinski |
| night.jpg | [Voie Lactée](https://www.flickr.com/photos/81602246@N03/9415192288/) | Niko Kaptur |
| night_rain.jpg | [rain](https://www.flickr.com/photos/underpants/18975285258) | Jason Rosenberg |
