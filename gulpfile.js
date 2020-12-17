const gulp = require('gulp');
const { series, parallel, dest } = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const replace = require('gulp-replace');
const kit = require('gulp-kit');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const del = require('del');
const plumber = require('gulp-plumber');
const notifier = require('gulp-notifier');
const swString = new Date().getTime();

notifier.defaults({
    messages: {
        js: 'Javascript files compiled & Ready!',
        sass: 'CSS compiled successfully!',
        kit: 'HTML was delivered!'
    },
    prefix: '===',
    suffix: '===',
    exclusions: '.map'
});

filesPath = {
    sass: './src/sass/**/*.scss',
    js: './src/js/**/*.js',
    images: './src/img/**/*.+(png|jpg|gif|svg)',
    html: './html/**/*.kit'
};

// SASS
function sassTask(done) {
    gulp.src([filesPath.sass, "!./src/sass/widget.scss"])
        .pipe(plumber({ errorHandler: notifier.error }))
        .pipe(sourcemaps.init())
        .pipe(autoprefixer())
        .pipe(sass())
        .pipe(cssnano())
        .pipe(sourcemaps.write("."))
        .pipe(rename(function(path) {
            if (!path.extname.endsWith(".map")) {
                path.basename += ".min"
            }
        }))
        .pipe(dest('./dist/css'));
    done();
}

// JavaScript 
function jsTask(done) {
    gulp.src(['./src/js/project.js', './src/js/alert.js'])
        .pipe(plumber({ errorHandler: notifier.error }))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(concat('project.js'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(dest("./dist/js"));
    done();
}

// Image Optimization 
function imagesTask(done) {
    gulp.src(filesPath.images)
        .pipe(cache(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ])))
        .pipe(dest('./dist/img/'));
    done();
}

// HTML Kit templating
function kitTask(done) {
    gulp.src(filesPath.html)
        .pipe(plumber({ errorHandler: notifier.error }))
        .pipe(kit())
        .pipe(htmlmin({
            collapseWhitespace: true,
            sortAttributes: true,
            sortClassName: true
        }))
        .pipe(replace(/sw=\d+/g, 'sw=' + swString))
        .pipe(dest("./dist"));
    done();
}

// Watch Task
function watch(done) {
    gulp.watch(
        [
            filesPath.sass,
            filesPath.html,
            filesPath.js,
            filesPath.images
        ],
        parallel([sassTask, jsTask, imagesTask, kitTask]))
    done();
}

// Cache Busting for CSS JS 
function cacheBustTask(done) {
    gulp.src(filesPath.html)
        .pipe(replace(/sw=\d+/g, 'sw=' + swString))
        .pipe(dest('./html'))
    done();
};

// Clear Cache for images 
function clearCache(done) {
    cache.clearAll(done);
    done();
};

// Clean 'dist' Folder 
function clean(done) {
    del(['./dist/**/*']);
    done();
};

// Gulp individual tasks
exports.sasstask = sassTask;
exports.jstask = jsTask;
exports.imagestask = imagesTask;
exports.kittask = kitTask;
exports.watch = watch;
exports.clearcache = clearCache;
exports.clean = clean;
exports.cachebusttask = cacheBustTask;

// Gulp serve 
exports.build = parallel(sassTask, jsTask, imagesTask, kitTask, cacheBustTask);

// Gulp default command
exports.default = series(exports.build, cacheBustTask, watch);

// "**/*.html" normal HTML path