# Video de pitch (2:26)

`awayu-pitch.mp4` (1080p, voz boliviana, subtítulos quemados) y `awayu-pitch-sin-subtitulos.mp4` no se suben al repo por su peso. `awayu-pitch.srt` tiene la narración con tiempos.

Cómo se rehace, desde una carpeta con `npm i playwright-core ffmpeg-static` y `pip install edge-tts`:

1. `node pitch_voz.mjs`: narración por escena con la voz `es-BO-SofiaNeural` (texto en `pitch_guion.mjs`).
2. `node pitch_grabar.mjs`: graba cada escena en el sitio publicado, tan larga como su narración.
3. `node pitch_montar.mjs`: tarjetas, rótulos, transiciones, música propia generada con ffmpeg, voz y subtítulos.
