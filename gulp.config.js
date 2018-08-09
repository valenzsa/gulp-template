// All paths are "glob" not regex
module.exports = function() {

    /****************************
     * projectName: Change this value to change the name of compliled css and js files.
     * This name is also used to locate main css and js files before compiling and randomg css and js
     * files in their respective folders.
     * 
     * sourceFolder: Working directory. Change this value to change the name of the working directory.
     * 
     * htmlPartialsFolder: The name of the folder that stores html partials to be injected into html files.
     * 
     * destFolder: Production directory. Change this value to change the name of the production directory
     * where compiled files are put and where browsersync is run.
     * 
     * NOTE: by default, folders starting with an underscore (_) are ignored in the source, except for partials
     * This is being used by default as a way to separate html partials and html that is to be compiled, but
     * can also be used to hide other source files. To turn this feature off, remove lines that start with:
     *      '!' + sourceFolder
     * 
     * 
     */
    var projectName = 'superhero';
    var sourceFolder = 'src';
    var htmlPartialsFolder = '_partials';
    var destFolder = 'app';

    var config = {

        projectName: projectName,

        /****************************
         * FILE INPUT PATHS
         * 
         * For source JS, CSS, SASS, and LESS, list vendor files first
         * 
         */

        src: {
            root: sourceFolder + '/',
            html: [
                sourceFolder + '/**/*.html',
                sourceFolder + '/**/*.htm',
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],

            htmlPartials: [
                sourceFolder + '/' + htmlPartialsFolder + '/' + '*.html',
                sourceFolder + '/' + htmlPartialsFolder + '/' + '*.htm',
            ],

            // all js for "gulp lint-js"
            alljs: [
                sourceFolder + '/**/*.js', //js files in src
                './*.js', //js files in root folder (not project files. Used to debug gulpfile.js and gulp.config.js)
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],

            // list source JS to be compiled in order into one file
            js: [
                sourceFolder + '/js/jquery.js', //example of a common vendor file. Will be skipped if not found
                sourceFolder + '/js/' + projectName + '.js', // our main project file if one exists
                sourceFolder + '/js/**/*.js', // any .js left in /src/js/
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            // list source CSS to be compiled in order into projectName.css
            css: [
                sourceFolder + '/css/bootstrap.css', //example of a common vendor file. Will be skipped if not found
                sourceFolder + '/css/' + projectName + '.css', // our main project file if one exists
                sourceFolder + '/css/**/*.css', // any .css left in /src/css/
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            // list source LESS to be compiled in order into projectName.css
            less: [
                sourceFolder + '/less/' + projectName + '.less', // our main project file if one exists
                sourceFolder + '/less/**/*.less', // any .less in /src/less/
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            // list source SASS to be compiled in order into projectName.css
            sass: [
                sourceFolder + '/sass/' + projectName + '.sass', // our main project file if one exists
                sourceFolder + '/sass/' + projectName + '.scss', // our main project file if one exists
                sourceFolder + '/scss/' + projectName + '.sass', // our main project file if one exists
                sourceFolder + '/scss/' + projectName + '.scss', // our main project file if one exists
                sourceFolder + '/sass/**/*.sass', // any .sass in /src/sass/
                sourceFolder + '/sass/**/*.scss', // any .scss in /src/sass/
                sourceFolder + '/scss/**/*.sass', // any .sass in /src/scss/
                sourceFolder + '/scss/**/*.scss', // any .scss in /src/scss/
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            fonts: [
                sourceFolder + '/fonts/**/*.*', // any files in /src/fonts,
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            img: [
                sourceFolder + '/images/**/*.*', // any files in /src/images
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
            docs: [
                sourceFolder + '/docs/**/*.*', // any files in /src/docs
                '!' + sourceFolder + '/**/_*/**/*', // exclude files/subfolders in folders starting with '_'
            ],
        },

        /****************************
         * FILE OUTPUT PATHS
         * 
         * Add/change path globs where files will be compiled to.
         * 
         */

        dest: {
            root: destFolder + '/',
            html: destFolder + '/',
            css: destFolder + '/css/',
            js: destFolder + '/js/',
            img: destFolder + '/images/',
            fonts: destFolder + '/fonts/',
            docs: destFolder + '/docs/',
            nodemodules: 'node_modules/',
        },

        /****************************
         * SERVER CONFIGURATIONS
         */

        port: 3000,

        /****************************
         * FTP CONFIGURATIONS
         * 
         * NOTE: SFTP connections DO NOT WORK
         */

        deploy: {
            staging: {
                ftphost: "FTPserverIP",
                ftpport: 21,
                user: "username",
                pass: "password",
                remotePath: "/mywebsitefolder.com/" // path to the root folder of the website
            },
            prod: {
                ftphost: "FTPserverIP",
                ftpport: 21,
                user: "username",
                pass: "password",
                remotePath: "/mywebsitefolder.com/" // path to the root folder of the website
            }
        }
    };
    return config;
};