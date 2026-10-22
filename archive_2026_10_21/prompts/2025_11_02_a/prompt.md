Have a look at this awesome tutorial which starts here: https://svelte.dev/tutorial/svelte/welcome-to-svelte
This is the second step here: https://svelte.dev/tutorial/svelte/your-first-component
And here is the third step: https://svelte.dev/tutorial/svelte/dynamic-attributes
I followed this whole tutorial through and had a great time doing it...
When you try and copy and paste the little bits of text it advises to put in you get this message:
```
Copy and paste is currently disabled!
We recommend typing the code into the editor to complete the exercise, as this results in better retention and understanding.
```
I really like this because I think it's true.
The only thing I don't like about the tutorial is that the typescript code formatting: I prefer that typescript code is formatted with the JS Standard style formatting, specifically not including semi colons at the end.
But I just love the way the tuturial proceeds in small steps where each step gets you to do something small and then gives an explanation about how the framework works so you are doing something practical but with each step you are also learning something about the framework. 
Its almost like it starts with a hello world step and then develops that complexity.
If you could, I would love it if you could develop me a tutorial like that for the following project:

I would like to get a little one page app website going. 
It will show a map of France with all the departments outlined pretty much looking like this one from the french meteo alert website here: https://vigilance.meteofrance.fr/fr
This is a beautiful and simple interactive map.
I would like to have a map like this that I can start to manipulate and start to really understand things about French geography and departments.
For example I would like to have a kind of library or api type thing were I can simply say:
```
display the map of france (with the department outlines)
color in the following departments in red: 22, 49, 63
color in the following departments in blue: 75, 69, 13
for the following department please color all the direct touching neighbours in green: 49
```
For the technologies involved I would like to use Svelte, vite and D3.js if appropriate. I'm still learning Svelte so if there are oppurtunities to revise basic concepts while implementing this project it would be great. For D3.js it is the same.
I will be developing on a desktop but I would really like by the end of the day to be able to have something that looks good on a phone. 
You don't have to give me the whole tutorial in one go, it can be a series of tutorials (maybe breakdown the big roadmap) where you give me just the first sub-tutorial of say 10 steps.
Basically by tomorrow morning I would like to be able to say point my phone to a github pages site where I've somehow compiled the site to some kind of dist version that I look up the github pages site and there is my beautiful full screen outline of the map of france that I can say tap on one of the departments and it puts the outline in bold and shows the department name and number.
Maybe there might be some web scraping involved in this project to get the actual data the french meteo site uses for the outline, but this data may end up coming from a publicly available french government repo - I think these kind of things exist.
Oh and I would absolutely love it if the site/app could work offline on a mobile device and kind of be testable like this... like maybe using capacitor or some other way that I can very easily get the project onto my iphone and have a play with it, even if I'm not connected to the network.
Ok good luck and let me know how you go with all that!
