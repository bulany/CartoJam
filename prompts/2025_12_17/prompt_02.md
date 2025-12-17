Ok that was interesting... can we please go back to the original version and make a new version from that.
Specifically I would like to keep the title of the page as "Oscilloscope Earth", please don't change that.
Also please take out the tailwind css stuff and forget about that - it seems to make things way more complicated than it seems they need to be. 
For the buttons, let's make them much simpler... I prefer this:
```css
        /* --- CONTROLS --- */
        .hud-btn {
            position: absolute;
            z-index: 20;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid currentColor;
            color: #00ffaa; /* Default color, updated by JS */
            padding: 10px 15px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            backdrop-filter: blur(2px);
            transition: all 0.2s;
        }

        .hud-btn:hover {
            background: rgba(0, 255, 170, 0.1);
            box-shadow: 0 0 10px currentColor;
        }

        .hud-btn:active {
            transform: translateY(2px);
        }
```
Let's drop the light mode themes and just keep TAC-OPS and ARCHIVE... these are my favourites.
Let's drop all the other reveal modes and just keep top to bottom (N. POLE)
The glitch effect is mostly good but about 60% of the time they are very small glitches that just seem to make the globe lines flash a little... the other glitches that happen 40% of the time are bigger and they look much better... if those ones could happen all of the time I think this would be better.
