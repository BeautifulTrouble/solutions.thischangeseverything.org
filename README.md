# This Changes Everything Solutions Gallery

Prototype for the This Changes Everything "Beautiful Solutions" gallery.

## Install requirements

This is very much a work in progress!

* Jekyll 2.0.3 (and dependencies)

Jekyll plugins (still TBD)
* [jeyll-assets](https://github.com/ixti/jekyll-assets)
* [jekyll-asset_bundler](https://github.com/moshen/jekyll-asset_bundler)

There's extra stuff in here for local development with Grunt, which can be ignored for now (the same functionality is included in Jekyll for the most part)

## Installation

1. Get the source / sub-modules

`git clone git@github.com:BeautifulTrouble/solutions.thischangeseverything.org.git`

`git submodule init && git submodule update`


2. Install the JavaScript dependencies
`bower install`

3. Install the Ruby dependencies

If you don't have a global install of [Bundler](http://bundler.io/), you'll want to install that first:

`gem update && gem install bundler`

Then install the project requirements in local directory so that you know you're using the right ones:

`bundle install --path _vendor`

## Bundler, Jekyll & development modes

If you run Jekyll though Bundler the project can the gems installed in the `_vendor` directory: 

`bundle exec jekyll serve -w --config _config.yml`

That helps to ensure the project is using the right version of each gem, and that it's easily deployed. If you need to add more Ruby dependencies, add them to the `gemfile` and then run `bundle install --path _vendor`.

Configuration files can be added to switch modes:

`bundle exec jekyll serve -w --config _config.yml,_config.development.yml`

`bundle exec jekyll serve -w --config _config.yml,_config.development_w_grunt.yml`

The [Jekyll Assets Pipeline](http://ixti.net/jekyll-assets/) automatically compiles Less to CSS and concatentates JavaScript files. This is pretty much all that is required for development and it's fairly fast. The asset pipeline also handles minification, compression, and cache-busting on CSS, JS, and images on deployment.

## Development with Jekyll & Grunt

It's also possible to run the development set-up through Grunt. The `Gruntfile.js` has sensible defaults for developing that auto-compiles, lints, and beautifies JavaScript and Less, as well as BrowserSync for multi-screen testing, and Live Reload for template changes. 

It works nicely, but it's not fast. 

## General concepts

The app is set-up currently to:

* Generate a JSON file for each collection (solutions, theories, and tactics)
* Bootstrap the data directly into Backbone during the build process using a Jekyll include
* Backbone then takes over for UI interactions when the index page is loaded

How the data is generated:

* Each collection is stored in a `_collection_name` directory and registered in the `config.yml`
* Each file in the collection should be a .html or .md with [YAML front matter](http://jekyllrb.com/docs/frontmatter/) for the required fields

## What needs attention

Work that is not yet complete:

[] Design to come from Public Society September 1st, 2014
[] Image re-sizing during Jekyll build process (also need a way to reference the generated images)
[] Sorting and filtering the modules list, possibly using Isotope
[] Sub-views to display the related modules when in a module's detail view
[] Gateway / intro / help / "how this works" view(s)
[] Possible addition of search (mostly done via Jekyll Lunar.js search plugin)
[] Offline mode


