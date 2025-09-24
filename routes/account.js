var express = require('express');
var router = express.Router();

const accountHelper = require('../helpers/accountHelper');

const verifyLogin = (req, res, next) => {
  req.session.recentUrl = req.originalUrl
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

router.get('/signup', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.recentUrl) {
      res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
    } else {
      res.redirect('/')
    }
  } else {
    res.render('user/signup', { loginText: req.session.statusText, loginErr: req.session.loginErr });
    req.session.loginErr = false
  }
});

router.get('/login', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.recentUrl) {
      res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
    } else {
      res.redirect('/')
    }
  } else {
    res.render('user/login', { loginText: req.session.statusText, loginErr: req.session.loginErr });
    req.session.loginErr = false
  }
});

router.get('/logout', (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect('/');
    req.session.destroy()
  } else {
    res.redirect('/');
  }
});

router.post('/signup', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.recentUrl) {
      res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
    } else {
      res.redirect('/')
    }
  } else {
    accountHelper.doSignUp(req.body).then((response) => {
      req.session.status = response.status
      req.session.statusText = response.statusText
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        if (req.session.recentUrl) {
          res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
        } else {
          res.redirect('/')
        }
      } else {
        req.session.loginErr = true
        res.redirect('/signup')
      }
    });
  }
});

router.post('/login', (req, res, next) => {
  if (req.session.loggedIn) {
    if (req.session.recentUrl) {
      res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
    } else {
      res.redirect('/')
    }
  } else {
    accountHelper.doLogin(req.body).then((response) => {
      req.session.status = response.status
      req.session.statusText = response.statusText
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        if (req.session.recentUrl) {
          res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
        } else {
          res.redirect('/')
        }
      } else {
        req.session.loginErr = true
        res.redirect('/login')
      }
    });
  }
});

router.get('/edit-profile', verifyLogin, async (req, res) => {
  res.render('user/editProfile', { req })
});

router.post('/edit-profile', verifyLogin, async (req, res) => {
  if (req.session.user.admin) req.body.admin = true

  accountHelper.updateProfile(req.session.user._id, req.body).then((response) => {

    req.session.user = response.user
    if (req.session.recentUrl) {
      res.redirect(req.session.recentUrl);
      req.session.recentUrl = undefined
    } else {
      res.redirect('/')
    }
  })
});

module.exports = router;