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
    pattern: ['gulp-*', 'gulp.*', 'del', 'replace'],
    replaceString: /\bgulp[\-.]/
});

// Define directory paths
var dirs = {
    root: __dirname + './',
    app: path.join(__dirname, 'app'),
    bower: './bower_components',
    dev: path.join(__dirname, 'app', 'src'),
    prod: path.join(__dirname, 'app', 'dist'),
    js: 'js',
    sass: 'scss',
    css: 'css',
    img: 'img'
};

// Define beautifier options
var prettifyOpts = {
    'indent_size': 2,
    'indent_char': ' ',
    'indent_level': 0,
    'indent_with_tabs': false,
    'preserve_newlines': true,
    'max_preserve_newlines': 10,
    'jslint_happy': false,
    'space_after_anon_function': false,
    'brace_style': 'collapse',
    'keep_array_indentation': true,
    'keep_function_indentation': true,
    'space_before_conditional': true,
    'break_chained_methods': false,
    'eval_code': false,
    'unescape_strings': false,
    'wrap_line_length': 0
};

// Define gzip options
var gzOptions = {
    threshold: '2kb',
    gzipOptions: {
        level: 9
    }
};

// A filename that has been passed as a parameter
//     -- see @function getFile
var file = getFile();

/* End Globals */


/************************************
 * Functions
 ************************************/

/**
 * Get the file name if passed as parameter
 * @description : Set a single file to use for gulp.src
 *                          Useful for tasking this gulpfile
 * @tutorial : gulp <task> [--file] [filename]
 * @return {string} : filename to run task(s) on
 **/
function getFile() {
    var args = process.argv.slice(2);
    var flag = args[1];

    // Return filename when flag is '--file' or undefined
    return (flag && flag === '--file') ? args[2] : undefined;
}
/* End Functions */


/************************************
 * Tasks
 ************************************/

/**
 *  Setup Tasks
 *******************************/

// Complete project creation
//     - copy vendor imports to dev directory
gulp.task('setup', ['cp:js-vendor', 'cp:sass-foundation']);

// Copy Vendor JS Files
gulp.task('cp:js-vendor', function() {
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
    .pipe(plugins.plumber({
          errorHandler: function(error) {
            console.log(error.message);
            this.emit('end');
          }
      }))
    .pipe(gulp.dest(path.join(dirs.dev, dirs.js)))
    .pipe(plugins.notify('JS vendor files copied'));
});

// Copy Foundation Sass import and settings files to scss/vendor/
gulp.task('cp:sass-foundation', function() {
  var src = [
    './bower_components/foundation/scss/foundation/_settings.scss',
    './bower_components/foundation/scss/foundation.scss'
  ];
  var dest = path.join(dirs.dev, dirs.sass, 'vendor/foundation/');

  return gulp.src(src)
      .pipe(gulp.dest(dest))
      .pipe(plugins.notify('Foundation Sass files copied'));
});


/**
 *  JavaScript Tasks
 *******************************/

// Combine JS tasks (lint and format)
gulp.task('js', ['js:lint', 'js:pretty']);

// Lint JS
gulp.task('js:lint', function() {
  var srcPath = path.join(dirs.dev, dirs.js),
        src = file || [path.join(srcPath, '**/*.js') ,'!' + srcPath + '**/*.min.js'],
        dest = path.join(srcPath);

  console.log('file: ' + file);
  return gulp.src([path.join(src, '**/*.js'), '!' + src + '**/*.min.js'])
    .pipe(plugins.plumber({
          errorHandler: function(error) {
            console.log(error.message);
            this.emit('end');
          }
      }))
    .pipe(plugins.changed(dest))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    // .pipe(plugins.jsPrettify(prettifyOpts))
    .pipe(gulp.dest(dest))
    // .pipe(plugins.connect.reload())
    .pipe(plugins.notify('JavaScript has been linted'));
});

// Format JS
gulp.task('js:pretty', function() {
  var src = path.join(dirs.dev, dirs.js);
    return gulp.src(src)
        .pipe(plugins.plumber({
            errorHandler: function(error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(plugins.changed(src))
        .pipe(plugins.jsPrettify(prettifyOpts))
        .pipe(gulp.dest(src))
        .pipe(plugins.notify('JavaScript has been formatted'));
});

// Minify and gzip JS
gulp.task('js:min', function() {
  var src = path.join(dirs.dev, dirs.js),
        dest = path.join(dirs.dev, dirs.js);

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
      .pipe(gulp.dest(dest));
});


// Bundle vendor js into one file
gulp.task('bundle-js',  function() {
    var root = path.join(dirs.dev, dirs.js);
    // List dependcies first
    var jsList = ['foundation.min.js', 'jquery.min.js'];

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
        .pipe(plugins.notify('Bundled JavaScript files'));
});
/* End JavaScript Tasks */


/**
 * Sass/Css Tasks
 * *****************************/

// Styles Task
// Compile Sass to CSS
gulp.task('css:styles', function() {
  // Set compile style
  var style = 'expanded'; // options: nested, compact, expanded

  return gulp.src(path.join(dirs.dev, dirs.sass, 'main.scss'))
      .pipe(plugins.plumber({
            errorHandler: function (error) {
            console.log(error.message);
            this.emit('end');
      }}))
      .pipe(plugins.compass({
            config_file: './config.rb',
            css: path.join(dirs.dev, dirs.css),
            sass: path.join(dirs.dev, dirs.sass),
            style: style
      }))
      .pipe(plugins.autoprefixer({
                browsers: ['last 2 versions']
      }))
      .pipe(gulp.dest(path.join(dirs.dev, dirs.css)))
      // .pipe(plugins.connect.reload())
      .pipe(plugins.notify('Compiled: SCSS --> CSS (' + style + ')'));
});

// Remove unused CSS
gulp.task('css:uncss', function() {
    return gulp.src(path.join(dirs.dev, dirs.css, 'main.css'))
        .pipe(plugins.uncss({
            html: [path.join(dirs.dev, '**/*.html')]
        }))
        .pipe(gulp.dest(path.join(dirs.dev, dirs.css)));
});

// Minify vendor CSS
gulp.task('css:min', function() {
  return gulp.src(path.join(dirs.dev, dirs.css, '*.css'))
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
      .pipe(gulp.dest(path.join(dirs.dev, dirs.css)))
      .pipe(plugins.gzip(gzOptions))
      .pipe(gulp.dest(path.join(dirs.dev, dirs.css)));
  });


/**
 *  Image Tasks
 *******************************/

 // Optimize jpg
 gulp.task('img:min', function() {
    var src = path.join(dirs.dev);

    return gulp.src([path.join(src, dirs.img), path.join(src, dirs.css, 'img')])
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(path.join(dirs.dev, dirs.img)))
        .pipe(plugins.notify('Images Optimized'));
 });

/**
 *  Build Tasks
 *******************************/

 // GZip JS and CSS
 gulp.task('zipem', function() {
  // src: Source path array
  //     - not path ('!') is to exclude existing .gz and .map files
  var src= [
          path.join(dirs.prod, dirs.css, '**/*.css'),
          '!' + path.join(dirs.prod, dirs.css, '**/*.css.*'),
          path.join(dirs.prod, dirs.js, '**/*.js'),
          '!' + path.join(dirs.prod, dirs.js,'**/*.js.*')
        ];

  // dest: Destination path array
  var dest = dirs.prod;

  return gulp.src(src)
      .pipe(plugins.gzip(gzOptions))
      .pipe(gulp.dest(dest));
 });


/**
 *  Server & Watch Tasks
 *  *****************************/

// Create server with livereload
gulp.task('connect', function() {
    plugins.connect.server({
        root: dirs.dev,
        livereload: true
    });
});

// Reload on html file change
gulp.task('html', function() {
    return gulp.src(path.join(dirs.dev,'**/*.html'))
    .pipe(plugins.notify('HTML has been saved'))
    .pipe(plugins.connect.reload());
});

// Watch HTML Task
gulp.task('watch',['connect'], function() {
    gulp.watch([path.join(dirs.dev, '**/*.html')], ['html']);
    gulp.watch(path.join(dirs.dev, dirs.sass, '**/*.scss'), ['css:styles']);
    // gulp.watch(path.join(dirs.dev, dirs.css, 'main.css'), ['uncss']);
    gulp.watch(path.join(dirs.dev, dirs.js, '**/*.js'), ['js']);
});

// Default Task
gulp.task('default', ['connect', 'watch']);

