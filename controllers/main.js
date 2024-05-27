export const getIndex = (req, res, next) => {
    res.render('main/index', {
        pageTitle: 'Reccipt | Your one stop shop for purchases',
        path: '/'
    });
};
