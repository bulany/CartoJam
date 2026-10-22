Create a polished, geographical French department guessing web game contained entirely within a single HTML file using d3.js. The game should feature a modern minimalist aesthetic with the following specifications:

1. Visual Style & Atmosphere
*Aesthetic:* Modern and minimal a bit like the official department map contained at https://vigilance.meteofrance.fr/fr. This map features all the mainland departments and corsica with nice crisp and simple outlines with borders of the departments going bold when the mouse rolls over them.
*Assets:* If you can use an official french government department map dataset it would be great, otherwise something simple and open source would be fine.

2. Gameplay Mechanics
*Perspective:* Just a 2D top down map of France and its departments similar to the one featured at https://vigilance.meteofrance.fr/fr
*Core Loop:* The player presses start and has 2 minutes. The number of a random department is shown in the corner of the screen. The user has to click on the department they think corresponds to that department. If they get it wrong, the number of the department they clicked on is shown (within the department) with an arrow pointing from where they clicked in the general direction of the department that they have to guess (as a kind of clue). The user can click as many times as they want until they click the right deparment, in which case the name of the department is shown with some positive feedback and one point is obtained. The user tries to guess as many correct departments as they can in the time available. The random departments are picked each time but there is never a repeated department. At the end of the 2 minute round the total score is shown along with a kind of playback of each correct department number and name guessed as those regions flash on the map.
*Game Over:* When the timer ends.
*UI:* Initially a start button with a greyed out map that is still responsive to rollovers and gives region names. Once start is pressed the map becomes ungreyed and responds to clicks on each department as guesses of that department.

3. Controls (Cross-Platform)
The game must detect the device type or input method:
*Desktop/Web/Mobile/Touch:* 
Detect a *Tap* anywhere on the map and determine the name and number of the French department

4. Technical Constraints
*Single File:* All HTML, CSS, and JavaScript (including the d3.js library imported via CDN) must be in one `index.html` file. Do not output any other text other than the html response.
*Responsiveness:* The canvas must resize dynamically to fit any screen size without stretching the aspect ratio.