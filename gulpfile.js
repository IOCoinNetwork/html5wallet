var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    max = require('gulp-msx'),
    plumber = require('gulp-plumber');

gulp.task('styles', function(){
    gulp.src('views/stylus/style.styl')
    .pipe(plumber())
    .pipe(stylus())
    .pipe(gulp.dest('views/css/'));
});

gulp.task('msx', function(){
    gulp.src('src/msx/*.js')
    .pipe(plumber())
    .pipe(max({harmony: true}))
    .pipe(gulp.dest('src/views/'))
});

gulp.task('watch', function(){
    gulp.watch('views/stylus/**/*.styl', ['styles']);
    gulp.watch('src/msx/*.js', ['msx']);
});


gulp.task('default', ['styles', 'msx', 'watch']);
