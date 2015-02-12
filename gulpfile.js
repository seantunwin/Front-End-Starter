'use strict';

/***************************
 *  Globals
 ***************************/

// Include Gulp
var gulp  = require('gulp');
// Include Path
var path = require('path');

// Include plugins
var plugins = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'main-bower-files', 'del'],
    replaceString: /\bgulp[\-.]/
});

// Define directory paths
var dirs = {
    root: __dirname + './',
    bower: './bower_components',
    devDest: './src',
    prodDest: './dist',
    js: 'js',
    sass: 'scss',
    css: 'css',
    img: 'img'
};

// Define beautifier options
var prettifyOpts = {
    "indent_size": 2,
    "indent_char": " ",
    "indent_level": 0,
    "indent_with_tabs": false,
    "preserve_newlines": true,
    "max_preserve_newlines": 10,
    "jslint_happy": false,
    "space_after_anon_function": false,
    "brace_style": "collapse",
    "keep_array_indentation": true,
    "keep_function_indentation": true,
    "space_before_conditional": true,
    "break_chained_methods": false,
    "eval_code": false,
    "unescape_strings": false,
    "wrap_line_length": 0
}

// Define gzip options
var gzOptions = {
    threshold: '2kb',
    gzipOptions: {
        level: 9
    }
};
/* End Globals */


/************************************
 * Tasks
 ************************************/

/**
 *  JavaScript Tasks
 *******************************/

// Lint and format JS
gulp.task('lint-js', function() {
  var src = path.join(dirs.devDest, dirs.js),
        dest = path.join(dirs.devDest, dirs.js);
  return gulp.src([path.join(src, '**/*.js'), '!' + src + '**/*.min.js'])
    .pipe(plugins.plumber({
          errorHandler: function(error) {
            console.log(error.message);
            this.emit('end');
          }
      }))
    .pipe(plugins.jshint())
    .pipe(plugins.jsPrettify(prettifyOpts))
    .pipe(gulp.dest(dest))
    .pipe(plugins.connect.reload())
    .pipe(plugins.notify('JavaScript has been formatted'));
});

// Minify and gzip JS
gulp.task('min-js', function() {
  var src = path.join(dirs.devDest, dirs.js),
        dest = path.join(dirs.devDest, dirs.js);
  return gulp.src([path.join(src, '**/*.js'), '!' + src + '**/*.min.js'])
    .pipe(plugins.plumber({
          errorHandler: function(error) {
            console.log(error.message);
            this.emit('end');
          }
      }))
      .pipe(plugins.uglify())
      .pipe(plugins.rename({ suffix: '.min' }))
      .pipe(gulp.dest(dest))
      .pipe(plugins.gzip(gzOptions))
      .pipe(gulp.dest(dest))
});

// Copy Vendor JS Files
gulp.task('cp-vendor-js', function() {
    var jsFiles = {
        modernizr: 'modernizr/modernizr.js',
        jquery: 'jquery/dist/**/*.min.js',
       foundation: 'foundation/js/foundation.min.js'
    };

    var jsPaths = [
        path.join(dirs.bower, jsFiles.modernizr),
        path.join(dirs.bower, jsFiles.jquery),
        path.join(dirs.bower, jsFiles.foundation)
    ];

    return gulp.src(jsPaths)
    .pipe(gulp.dest(path.join(dirs.devDest, dirs.js)))
    .pipe(plugins.notify('Files copied'));
});

// Tidy up Modernizr (minify, rename, delete pretty version)
gulp.task('tidy-modernizr', ['cp-vendor-js'], function() {
    var src = path.join(dirs.devDest, dirs.js, 'modernizr.js');

    return gulp.src(src)
    .pipe(plugins.clean())
    .pipe(plugins.uglify())
    .pipe(plugins.rename({ suffix: '.min'}))
    .pipe(gulp.dest(path.join(dirs.devDest, dirs.js)))
    .pipe(plugins.notify('File renamed'));
});

// Perform: Copy Vendor JS
gulp.task('copy-vendor-js', ['tidy-modernizr']);

// Bundle vendor js into one file
gulp.task('bundle-js', ['copy-vendor-js'],  function() {
    var root = path.join(dirs.devDest, dirs.js);
    var jsList = ['modernizr.min.js', 'jquery.min.js'];

    function addPathToFiles(files) {
        var i = 0;

        while (i < files.length) {
            files[i] = path.join(root, files[i]);
            i += 1;
        }
    }

    addPathToFiles(jsList);

    return gulp.src(jsList)
        .pipe(plugins.plumber({
            errorHandler: function(error) {
              console.log('ErrMsg: ' + error.message);
              this.emit('end');
            }
        }))
        // .pipe(plugins.clean())
        // .pipe(plugins.concat('bundle.js'))
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(gulp.dest(root))
        .pipe(plugins.gzip(gzOptions))
        .pipe(gulp.dest(root))
        .pipe(plugins.notify('Bundled and deleted old files'));
});
/* End JavaScript Tasks */

/**
 * Sass/Css Tasks
 * *****************************/

// Styles Task
// Combine and minify Sass/Compass stylesheets
gulp.task('styles', function() {
  var style = 'expanded'; // options: nested, compact, expanded
  return gulp.src(path.join(dirs.devDest, dirs.sass, 'main.scss'))
      .pipe(plugins.plumber({
            errorHandler: function (error) {
            console.log(error.message);
            this.emit('end');
      }}))
      .pipe(plugins.compass({
            config_file: './config.rb',
            css: path.join(dirs.devDest, dirs.css),
            sass: path.join(dirs.devDest, dirs.sass),
            style: style
      }))
      .pipe(plugins.autoprefixer({
                browsers: ['last 2 versions']
      }))
      .pipe(gulp.dest(path.join(dirs.devDest, dirs.css)))
      .pipe(plugins.connect.reload())
      .pipe(plugins.notify('Compiled: SCSS --> CSS (' + style + ')'));
});

// Remove unused CSS
gulp.task('uncss', function() {
    return gulp.src(path.join(dirs.devDest, dirs.css, 'main.css'))
        .pipe(plugins.uncss({
            html: [path.join(dirs.devDest, '**/*.html')]
        }))
        .pipe(gulp.dest(path.join(dirs.devDest, dirs.css)));
});

// Minify vendor CSS
gulp.task('min-css', function() {
  return gulp.src(path.join(dirs.devDest, dirs.css, '*.css'))
      .pipe(plugins.plumber({
          errorHandler: function(error) {
            console.log(error.message);
            this.emit('end');
          }
      }))
      .pipe(plugins.minifyCss({
            rebase: false,
            roundingPrecision: -1,
            shorthandCompacting: false
      }))
      .pipe(gulp.dest(path.join(dirs.devDest, dirs.css)))
      .pipe(plugins.gzip(gzOptions))
      .pipe(gulp.dest(path.join(dirs.devDest, dirs.css)))
  });


/**
 *  Image Tasks
 *******************************/

 // Optimize jpg
 gulp.task('images', function() {
    var src = path.join(dirs.devDest);
    return gulp.src([path.join(src, dirs.img), path.join(src, dirs.css, 'img')])
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(path.join(dirs.devDest, dirs.img)))
        .pipe(plugins.notify('Images Optimized'));
 });

/**
 *  Server & Watch Tasks
 *  *****************************/

// Create server with livereload
gulp.task('connect', function() {
    plugins.connect.server({
        root: dirs.devDest,
        livereload: true
    });
});

// Reload on html file change
gulp.task('html', function() {
    return gulp.src(path.join(dirs.devDest,'**/*.html'))
    .pipe(plugins.notify('HTML has been saved'))
    .pipe(plugins.connect.reload());
});

// Watch HTML Task
gulp.task('watch',['connect'], function() {
    gulp.watch([path.join(dirs.devDest, '**/*.html')], ['html']);
    gulp.watch(path.join(dirs.devDest, dirs.sass, '**/*.scss'), ['styles']);
    // gulp.watch(path.join(dirs.devDest, dirs.css, 'main.css'), ['uncss']);
    gulp.watch(path.join(dirs.devDest, dirs.js, '**/*.js'), ['lint-js']);
});

// Default Task
gulp.task('default', ['connect', 'watch']);

