Have a look at the one page html app below which shows a nice retro futurisitic globe of the world.
I'm wondering how possible it would be to add to this the following:
An "add itinerary" button which brings up an interface where you can input a series of flight numbers and press 'done'.
Once the flight numbers are entered, the app goes off and looks up each of the flight numbers using some kind of flight tracking API (hopefully if something like this is available)... once it has all the details of each flights departure, destination etc it does the following: 
 - plots a nice dot representing the the departure and destination at the gps coordinates of each point.
 - maybe plot the three letter airport code at a sensible size underneath each airport dot
 - plots a nice 3d parabolic arc between each of the flights departure and destination
 - plots another dot representing the current flights progress (if any flights are on course in the current time)
 - has a little slider at the bottom that allows one to fast forward scrub through time from the first departure time until the arrival time of the last flight... and when the user scrubs through this they see a little dot representing the flight fly through the air... it would be good to have a time status display in a top corner showing time elapsed of the trip (the trip time includes all flight times), time at the original destination and time at the final destination.
 - once an itinerary has been entered would it be possible to have a 'share' button that could copy a URL to the clipboard and when someone loads that URL it's as if the user has already entered in all those flight codes - they can directly start tracking those flights once all the data has loaded.

It would be great if this looked good and functioned well on desktop but also on mobile.

 If all of this is too much for a one page html app please let me know what are the trickiest parts and maybe just show me how to plot the parabolic line between two airports - whatever is the longest single haul flight that is regularly flown. 
 Thank you!

 ## 02
 Ok how about making it much more simple and just being about to input a list of three letter airport codes. 
 Is there a public database that can look up the GPS coords of those?
 Once the user enters their list of codes, the time scrubber/scroller appears and it just allows to you scrub through the directly concatenated "flights"... Like say the airports, New York, Paris, London were entered (in their 3 letter code equivalents) then you would see the parabolic lines plotted and then when you scrub the time scroller a progress dot runs along each of the flight lines... starting at New York, then going to Paris, then London... you don't have to worry about the time layout unless its easy to say just assume a standard speed of passenger jet flight and calculate distances and flight times between airports like that.
 Also just a note... looking at the demo you sent previously, some of the flight lines appeared to be drawn on the interior of the globe... maybe try a different system for drawing these lines this time (if you can't see what the problem was)... even if this system is just a straight line between the two points created in the same way as how you drew the lines for the continent outlines.
