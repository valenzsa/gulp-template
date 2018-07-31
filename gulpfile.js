//plugins needed
var gulp = require('gulp');
var args = require('yargs').argv;
var gulpPrint = require('gulp-print').default;
var merge2 = require('merge2');
var del = require('del');
var browserSync = require('browser-sync');
var deleteEmpty = require('delete-empty');
var ftp = require( 'vinyl-ftp' );
var autoprefixer = require('autoprefixer');

var $ = require('gulp-load-plugins')({lazy: true}); // loads plugins automatically when needed with $.

/* LOADED BY gulp-load-plugins
var jscs = require('gulp-jscs'); // code analysis
var jshint = require('gulp-jshint'); // code analysis
var util = require ('gulp-util');
var gulpif = require('gulp-if');
var sass = require('gulp-sass');
var less = require('gulp-less')
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cssmin = require('gulp-cssmin');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var concat = require('gulp-concat');  
var newer = require('gulp-newer');
var plumber = require('gulp-plumber');
var injectPartials = require('gulp-inject-partials');
var prompt = require('gulp-prompt');
var postcss = require('gulp-postcss');
*/

// loads configurations from gulp.config.js. used for src globs
var config = require('./gulp.config')();

// default task run when typing only 'gulp' is 'help' which lists available tasks
gulp.task('default', ['help']);
gulp.task('help', $.taskListing);


/****************************
 * THE MAIN TASKS (BUILT FROM OTHER TASKS)
 * 
 * Task format: gulp.task('this-tasks-name', [list of dependant tasks that run in parallel before the following function runs], function() { *this task's definition* });
 * 
 * gulp clean: clean the (dest)ination folder of files that will be built.
 * gulp clean-all: delete the (dest)ination folder.
 * gulp build [--min, --list]: clean, then compile and move from the (src) folder
 * gulp serve [--min, --list]: clean, then build, then watch the source files and start browsersync to view and live-edit the source
 * gulp watch [--min, --list]: clean, then build, then watch the source files to keep the app folder updated without starting browsersync
 * gulp deploy [--staging or --production]: Deploy files via FTP from (dest)ination folder to --staging or --production. Define FTP settings in gulp.config.js
 * 
 * Options:
 * 1) --min: minify the html, css, and js
 * 2) --list: list affected files
 * 3) Build task: Changing 'compile-styles' to 'compile-styles-separate' will compile each SASS, LESS, and CSS file separately and keep their filename changing the extension to .css
 *    With this option, be sure to use different filenames for .less .sass .scss and .css OR THEY WILL BE OVERWRITTEN IN THE APP FOLDER. You can also change 'compile-js' to 'compile-js-separate'
 *    to keep js files as separate files to be included in html separately.
 * 4) Clean task: tasks clean-images, clean-docs, and clean-fonts exist and can be used separately or can be added to the list of dependant tasks. They have been omitted to save time.
 * 
 */

gulp.task('clean', ['clean-styles', 'clean-js', 'clean-html'], function() { // Other clean meathods for images, docs, fonts, node-modules are defined below if needed
    deleteEmpty.sync(config.dest.root);
});
gulp.task('clean-all', function() {clean(config.dest.root);});
gulp.task('build', ['clean', 'compile-styles', 'compile-html', 'compile-js', 'compile-images', 'compile-docs', 'compile-fonts']);
gulp.task('serve', ['build', 'less-watcher', 'sass-watcher', 'css-watcher', 'html-watcher', 'html-partials-watcher', 'js-watcher', 'images-watcher', 'docs-watcher', 'fonts-watcher', 'start-browsersync']);
gulp.task('watch', ['build', 'less-watcher', 'sass-watcher', 'css-watcher', 'html-watcher', 'js-watcher', 'images-watcher', 'docs-watcher', 'fonts-watcher']);
gulp.task('deploy', ['ftp-files']);

// ----------------------- CODE ANALYSIS

gulp.task('lint-js', function() {
    log('Analyzing source JS');
    return gulp.src(config.src.alljs)
    //.pipe($.jscs())
    //.pipe($.jscs.reporter())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
    .pipe($.jshint.reporter('fail')); // stops the running task if error
});

// ----------------------- COMPILING TASKS

// remove 'lint-js' from dependencies if jshint is unnecessarily giving issues that prevents the project from being built

gulp.task('compile-js', ['clean-js', 'lint-js'], function() {
    log('Compiling JS');
    return gulp.src(config.src.js)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.concat(config.projectName + '.js'))
        .pipe($.if(args.min, $.uglify()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.js));
});

gulp.task('compile-js-separate', ['clean-js', 'lint-js'], function() {
    log('Compiling JS');
    return gulp.src(config.src.js)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.if(args.min, $.uglify()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.js));
});

gulp.task('compile-styles-separate', ['clean-styles', 'compile-less', 'compile-sass', 'compile-css']);
gulp.task('compile-styles', ['clean-styles'], function() {
    log('Compiling LESS --> CSS');
    var LESS = gulp.src(config.src.less)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.plumber())
        .pipe($.less());

    log('Compiling SASS --> CSS');
    var SASS = gulp.src(config.src.sass)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.plumber())
        .pipe($.sass({outputStyle: 'expanded'}).on('error', $.sass.logError));

    
    log('Getting plain CSS');
    var srcCSS = gulp.src(config.src.css)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init());

    // Change the order of LESS, SASS, And CSS in merge2 to change the order
    // that those styles will appear in the /app/projectName.css file
    log('Merging LESS, SASS, CSS');
    return merge2(LESS, SASS, srcCSS)
        .pipe($.concat(config.projectName + '.css'))
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(args.min, $.csso()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.css));
});


gulp.task('compile-less', function() {
    log('Compiling LESS');
    return gulp.src(config.src.less)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.less())
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(args.min, $.csso()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.css));
});

gulp.task('compile-sass', function() {
    log('Compiling SASS');
    return gulp.src(config.src.sass)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.sass({outputStyle: 'expanded'}).on('error', $.sass.logError))
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(args.min, $.csso()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.css));
});

gulp.task('compile-css', function() {
    log('Compiling CSS');
    return gulp.src(config.src.css)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.sourcemaps.init())
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(args.min, $.csso()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.css));
});

gulp.task('compile-html', ['clean-html'], function() {
    log('Compiling HTML');
    return gulp.src(config.src.html)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.injectPartials({ removeTags: true }))
        .pipe($.if(args.min, $.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        })))
        .pipe(gulp.dest(config.dest.html));
});

gulp.task('compile-images', function() {
    log('Compiling images');
    return gulp.src(config.src.img)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.newer(config.dest.img))
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.dest.img));
});

gulp.task('compile-docs', function() {
    log('Compiling docs');
    return gulp.src(config.src.docs)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.newer(config.dest.docs))
        .pipe(gulp.dest(config.dest.docs));
});

gulp.task('compile-fonts', function() {
    log('Compiling fonts');
    return gulp.src(config.src.fonts)
        .pipe($.if(args.list, gulpPrint())) // if --list then gulpprint() (list files)
        .pipe($.newer(config.dest.fonts))
        .pipe(gulp.dest(config.dest.fonts));
});

// ----------------------- CLEANING TASKS

gulp.task('clean-styles', function() {
    return clean(config.dest.css + '**/*.css');
});

gulp.task('clean-js', function() {
    return clean(config.dest.js + '**/*.js');
});

gulp.task('clean-html', function() {
    return clean(config.dest.html + '**/*.htm*');
});

gulp.task('clean-images', function() {
    return clean(config.dest.img);
});

gulp.task('clean-docs', function() {
    return clean(config.dest.docs);
});

gulp.task('clean-fonts', function() {
    return clean(config.dest.fonts);
});

// ----------------------- WATCHING TASKS

gulp.task('less-watcher', function() {
    gulp.watch(config.src.less, ['compile-styles', 'refresh-browsersync']);
});

gulp.task('sass-watcher', function() {
    gulp.watch(config.src.sass, ['compile-styles', 'refresh-browsersync']);
});

gulp.task('css-watcher', function() {
    gulp.watch(config.src.css, ['compile-styles', 'refresh-browsersync']);
});

gulp.task('html-watcher', function() {
    gulp.watch(config.src.html, ['compile-html', 'refresh-browsersync']);
});

gulp.task('html-partials-watcher', function() {
    gulp.watch(config.src.htmlPartials, ['compile-html', 'refresh-browsersync']);
});

gulp.task('js-watcher', function() {
    gulp.watch(config.src.js, ['compile-js', 'refresh-browsersync']);
});

gulp.task('images-watcher', function() {
    gulp.watch(config.src.img, ['compile-images', 'refresh-browsersync']);
});

gulp.task('docs-watcher', function() {
    gulp.watch(config.src.docs, ['compile-docs', 'refresh-browsersync']);
});

gulp.task('fonts-watcher', function() {
    gulp.watch(config.src.fonts, ['compile-fonts', 'refresh-browsersync']);
});

// ----------------------- SERVING TASKS


gulp.task('start-browsersync', function(){
    // browserSync will initialize all css, js and html when browserSync is initialized.
    browserSync.init([config.dest.css + '/*.css', config.dest.html + '/*.html',config.dest.root + '/*.aspx', config.dest.js + '/*.js'], {
        server: {
            baseDir : config.dest.html
        }
    });
});

gulp.task('refresh-browsersync', function() {
    browserSync.reload();
});

// ----------------------- DEPLOYMENT TASKS

gulp.task("ftp-files", function() {
var conn;
    if (args.staging) {
        conn = startStagingFTP();
        return gulp.src(config.dest.root + "**/*.*", {base: './' + config.dest.root, buffer: false})
            .pipe(conn.newer(config.deploy.staging.remotePath)) // only upload newer files
            .pipe(conn.dest(config.deploy.staging.remotePath));
    } else if (args.prod) {
        conn = startProdFTP();
        return gulp.src(config.dest.root + "**/*.*", {base: './' + config.dest.root, buffer: false})
            .pipe($.prompt.confirm('Are you sure you want to deploy to PROD?'))
            .pipe(conn.newer(config.deploy.prod.remotePath)) // only upload newer files
            .pipe(conn.dest(config.deploy.prod.remotePath));
    } else {
        return warn('Please specificify your deployment target: "--staging" or  "--prod"');
    }
});



/////////////////////////////////////////////////////////

function startStagingFTP() {
    var connection = ftp.create({
        host: config.deploy.staging.ftphost,
        user: config.deploy.staging.user,
        pass: config.deploy.staging.pass,
        port: config.deploy.staging.ftpport,
        parallel: 10,
        log: log
    });
    return connection;
}

function startProdFTP() {
    var connection = ftp.create({
        host: config.deploy.prod.ftphost,
        user: config.deploy.prod.user,
        pass: config.deploy.prod.pass,
        port: config.deploy.prod.ftpport,
        parallel: 10,
        log: log
    });
    return connection;
}

function startBrowserSync() {
    if (browserSync.active) {
        return;
    }

    log('Starting Browser-sync on port ' + config.port);

    var options = {
        //proxy: 'localhost:' + config.port,
        port: config.port,
        files: [
            config.dest.root + '**/*.*'
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };
}

function clean(path) {
    log('Cleaning: ' + $.util.colors.blue(path));
    return del.sync(path);
}

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

function warn(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
