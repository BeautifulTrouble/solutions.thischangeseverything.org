/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//= require jquery.js
//= require modernizr.js
//= require bootstrap.js
//= require underscore.js
//= require isotope.pkgd.js
//= require showdown.js


//= when working on the Backbone app
//=require backbone-app.js

$(function() {
    // Setting the background cover image on the body
    var body = $("body");
    body.css("background", "url('/ui/img/cover_about.jpg') top center no-repeat black");
    body.css("background-size", "cover");
    body.css("min-height", window.innerHeight);
    // Initialize a Showdown converter
    App.showdown = new Showdown.converter();
    // Initialize the Backbone router.
    App.router = new App.Router();
    Backbone.history.start();
});
