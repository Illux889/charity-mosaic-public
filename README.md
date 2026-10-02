# CoolUnite-mosaikken

Root-siden viser ét CoolUnite/Hornsleth-kunstværk. Den kan indlejres i en iframe på Illux og sender `charity-mosaic-height`, `charity-mosaic-donate` og `charity-mosaic-modal` til parent-vinduet. Sidstnævnte fortæller, om mindst én mosaikmodal er åben, så parent-siden kan styre sin egen scroll.

## Filer

- `target.png` og `overlay.png` er de justerede 1400 × 1960 web-assets. Begge tegnes i samme 5:7-koordinatsystem.
- `public-mosaic.json` og `mosaic-settings.json` bliver i root med uændret schema, fordi n8n skriver til disse stier.

Donorfelter fordeles på alle celler, som ikke er fuldt dækket af weboverlayet. En celle blokeres kun, når alle dens overlay-pixels har alpha på mindst 250. Celler langs kanten beholder derfor deres donor-billede under det originale overlay, som tegnes sidst på samme canvas og med samme koordinatsystem som target. Transparente target-pixels i randceller får referencefarve fra cellens synlige target-pixels, så de ikke giver en lys kant.

Den offentlige side viser kun den interaktive mosaik.

Lokal visning: start en HTTP-server i repository-roden, og åbn `http://localhost:<port>/`.
