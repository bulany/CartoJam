This is really great.
Just a couple of things:
1. The style of code is good with no semicolons but it would be great if it was typescript code with type hints just in the spots where necessary. Most of the time in vscode there is no problem but sometimes I got little red underlines where I just added `let pathData: Array<any> = []` to get the little red underline to go away.
2. Like I said no semicolons in the script part is good but I think you have to have semicolons in the css, so it would be good to not forget them.
The direction I would like to take with the app is now the following:
A little interactive 'game' which works as follows:
When you start a new 'round' which lasts a specific amoung of time: let's say 2 minutes, the following happens:
The timer starts and a department number is shown (fairly large, with the name below it but quite a bit smaller) beside the map. You have to click departments until you happen to click the department with same number. Each time you click a 'wrong' department, its name and number are somehow indicated but quickly fade away so you can keep clicking (although a record is kept).
Once they guess the right department, some positive feedback is given (a happy sound as opposed to when you click the wrong one, an unhappy sound... although sounds should be really at the end of the tutorial list after the basic game functionality is well established)
You keep clicking departments until finally your time runs out and you have a score of how many correct departments you got.
The idea is to try and get as many correct guesses within the time limit and that determines your score.
At the end of the round, somekind of static summary is shown showing all your correct and incorrect guesses with the numbers - this is easy to take a screenshot of or a photo with your phone so you can send it and share it with friends to encourage them to have a go to.
Eventually it would be great to have some kind of a replay feature that you can kind of quickly playback your round at a much higher speed and relive all the times where you were 'on a roll' and also the times when you really went 'off the track' and had no idea where a particular department number was actually located. The idea being that somehow when reviewing these you can have a bit of a laugh but also identify weak spots on your geographic knowledge and passively get a bit of revision so that next time hopefully you get less tripped up when those departments come up.
So yeah, could you give me another tutorial of about the same length that goes in the direction of setting up this game, that would be really great - it worked fantastically the last tutorial.


