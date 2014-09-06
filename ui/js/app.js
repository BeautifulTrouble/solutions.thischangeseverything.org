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
    // Initialize a Showdown converter
    App.showdown = new Showdown.converter();
    // Initialize the Backbone router.
    App.router = new App.Router();
    Backbone.history.start();
});
