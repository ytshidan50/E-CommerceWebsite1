var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const hbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const db = require('./config/connection');
const session = require('express-session');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var accountRouter = require('./routes/account');

var app = express();

//                                     view engine setup
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'defaultLayout',
  layoutsDir: __dirname + '/views/layouts/',
  patialsDir: __dirname + '/views/partials/',
  helpers: {
    add: (num1, num2) => num1 + num2,
    sub: (num1, num2) => num1 - num2,
    mul: (num1, num2) => num1 * num2,
    div: (num1, num2) => num1 / num2,
    includes: (array, value) => { return array && array.some(item => item.equals(value)); },
    toString: (value) => { return value.toString(); },
    typeof: (data) => typeof (data),
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
    
    cond: (a, op, b) => {
      const ops = {
        '==': a == b, '===': a === b, '!=': a != b, '!==': a !== b,
        '<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b,
        '&&': a && b, '||': a || b
      };
      return ops[op] || false;
    },
    json: (context) => { return JSON.stringify(context) },
    substring: (str, s, e) => str ? str.substring(s, e) : '',
    formatDateShort: date => new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    }),
    formatDate: (date) => {
      if(!date){ return '' }
      return new Date(date).toLocaleString('en-IN', {
        hour: 'numeric', hour12: true, minute: '2-digit',
        weekday: 'short', day: '2-digit', month: 'short', year: '2-digit'
      }).replace(',', '');
    },
    formatDateShort: (date) => {
      if(!date){ return '' }
      return new Date(date).toLocaleString('en-IN', {
        hour: 'numeric', hour12: true, minute: '2-digit',
          day: '2-digit', month: 'short', year: '2-digit'
      }).replace(',', '').replace('Invalid Date', '');
    }
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(fileUpload());
app.use(session({ secret: '834fwejk284oel429uefwilkr384uhf', cookie: { maxAge: 3600000 } }))

//                                           Database setup
db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Database connected successfully');
  }
});

//                                            router
app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/', accountRouter);

//                            catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

//                                        error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;