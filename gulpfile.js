var gulp = require('gulp');

var concat       = require('gulp-concat'),
    rename       = require('gulp-rename'),
    addSrc       = require('gulp-add-src'),
    autoprefixer = require('gulp-autoprefixer'),
    sass         = require('gulp-sass'),
    minifyCSS    = require('gulp-minify-css'),
    jshint       = require('gulp-jshint'),
    uglify       = require('gulp-uglify'),
    ngAnnotate   = require('gulp-ng-annotate');

gulp.task('lint', function() {
  return gulp.src('xbook/statics/script/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
  return gulp.src('xbook/statics/script/**/*.js')
    .pipe(ngAnnotate())
    .pipe(concat('app.js'))
    .pipe(gulp.dest('xbook/statics/compiled'))
    .pipe(uglify())
    .pipe(rename('app.min.js'))
    .pipe(gulp.dest('xbook/statics/compiled'));
});

gulp.task('styles', function() {
  return gulp.src('xbook/statics/style/**/*.{css,scss}')
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(concat('app.css'))
    .pipe(gulp.dest('xbook/statics/compiled'))
    .pipe(minifyCSS())
    .pipe(rename('app.min.css'))
    .pipe(gulp.dest('xbook/statics/compiled'));
});

gulp.task('watch', function() {
  gulp.watch('xbook/statics/script/**/*.js', ['lint', 'scripts']);
  gulp.watch('xbook/statics/style/**/*.{css,scss}', ['styles']);
});

gulp.task('compile', ['lint', 'scripts', 'styles']);

gulp.task('default', ['compile']);
