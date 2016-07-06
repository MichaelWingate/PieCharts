# PieCharts

Displays and configures React/D3 pie charts

#Instructions

[Download node.js here](https://nodejs.org/en/)

Open up the command prompt and navigate to where you want the files. Ex:

`
cd documents/GitHub
`

Download the files from GitHub. (you can copy the url from above the files)

`
git clone https://github.com/MichaelWingate/PieCharts.git
`

Move into the created folder:

`
cd PieCharts
`

Install dependencies:

`
npm install
`

Start the server:

`
npm start
`

Then you can access the app from [http://localhost:3000](http://localhost:3000) in your browser.

#Updating

When you want to update your code with the changes I have pushed onto this repository, simply run this command:

`
git pull https://github.com/MichaelWingate/PieCharts.git
`

#Configuring

Open up app/app.js to make any changes not handled by the inputs. To use different data, change the url in the ajax request 
to the new file name. To change colors, pick a new D3 color scheme and specify it in the color field.
