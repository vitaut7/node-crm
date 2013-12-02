/*
 * Routes
 */

var prefix = '/api';

app.put(prefix + '/contact/account/:account([a-z0-9-]+)/manager/set', auth.checkAPIAuth, contact.setManager);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/manager/set', auth.checkAPIAuth, contact.setManager);
app.put(prefix + '/contact/account/:account([a-z0-9-]+)/manager/unset', auth.checkAPIAuth, contact.unsetManager);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/manager/unset', auth.checkAPIAuth, contact.unsetManager);
app.post(prefix + '/contact/account/:account([a-z0-9-]+)/add', auth.checkAPIAuth, contact.updateTeamSubscription);
app.put(prefix + '/contact/account/:account([a-z0-9-]+)/update', auth.checkAPIAuth, contact.updateContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/update', auth.checkAPIAuth, contact.updateContact);
app.del(prefix + '/contact/account/:account([a-z0-9-]+)/delete', auth.checkAPIAuth, contact.deleteContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/delete', auth.checkAPIAuth, contact.deleteContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/', auth.checkAPIAuth, contact.getContact);
app.put(prefix + '/contact/account/:account([a-z0-9-]+)/update', auth.checkAPIAuth, contact.updateContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/update', auth.checkAPIAuth, contact.updateContact);
app.del(prefix + '/contact/account/:account([a-z0-9-]+)/delete', auth.checkAPIAuth, contact.deleteContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/delete', auth.checkAPIAuth, contact.deleteContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/', auth.checkAPIAuth, contact.getContact);
app.get(prefix + '/contact/account/:account([a-z0-9-]+)/company', auth.checkAPIAuth, contact.getTeamMembers);
app.post(prefix + '/contact/add', auth.checkAPIAuth, contact.addContact);
app.get(prefix + '/contact/add', auth.checkAPIAuth, contact.addContact);
app.post(prefix + '/contact/add', auth.checkAPIAuth, contact.addContact);
app.get(prefix + '/contact/add', auth.checkAPIAuth, contact.addContact);
app.post(prefix + '/contact/import', auth.checkAPIAuth, contact.importContact);
//app.get(prefix + '/contact/list', auth.checkAPIAuth, contact.allContacts);
app.get(prefix + '/contact/contact', auth.checkAPIAuth, contact.getContacts);
app.get(prefix + '/contact/company', auth.checkAPIAuth, contact.getCompanyContacts);
app.get(prefix + '/contact/account', auth.checkAPIAuth, contact.getAccounts);

app.put(prefix + '/lead/:lead([a-z0-9-]+)/update', auth.checkAPIAuth, lead.updateLead);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/update', auth.checkAPIAuth, lead.updateLead);
app.del(prefix + '/lead/:lead([a-z0-9-]+)/delete', auth.checkAPIAuth, lead.deleteLead);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/delete', auth.checkAPIAuth, lead.deleteLead);
app.put(prefix + '/lead/:lead([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/update', auth.checkAPIAuth, leadHistory.updateHistory);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/update', auth.checkAPIAuth, leadHistory.updateHistory);
app.del(prefix + '/lead/:lead([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/delete', auth.checkAPIAuth, leadHistory.deleteHistory);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/delete', auth.checkAPIAuth, leadHistory.deleteHistory);
app.post(prefix + '/lead/:lead([a-z0-9-]+)/history/add', auth.checkAPIAuth, leadHistory.addHistory);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/history/add', auth.checkAPIAuth, leadHistory.addHistory);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/history', auth.checkAPIAuth, leadHistory.getAll);
app.get(prefix + '/lead/:lead([a-z0-9-]+)/', auth.checkAPIAuth, lead.getLead);
app.get(prefix + '/lead/status/:status([a-zA-Z]+)/', auth.checkAPIAuth, lead.getAllByStatus);
app.post(prefix + '/lead/add', auth.checkAPIAuth, lead.addLead);
app.get(prefix + '/lead/add', auth.checkAPIAuth, lead.addLead);
app.get(prefix + '/lead/', auth.checkAPIAuth, lead.getAll);

app.put(prefix + '/product/:product([a-z0-9-]+)/update', auth.checkAPIAuth, product.updateProduct);
app.get(prefix + '/product/:product([a-z0-9-]+)/update', auth.checkAPIAuth, product.updateProduct);
app.del(prefix + '/product/:product([a-z0-9-]+)/delete', auth.checkAPIAuth, product.deleteProduct);
app.get(prefix + '/product/:product([a-z0-9-]+)/delete', auth.checkAPIAuth, product.deleteProduct);
app.get(prefix + '/product/:product([a-z0-9-]+)/', auth.checkAPIAuth, product.getProduct);
app.get(prefix + '/product/segment/:segment([A-Za-z0-9%_\ ]+)/category/:category([A-Za-z0-9%_\ ]+)/product', auth.checkAPIAuth, product.getAllByCategory);
app.get(prefix + '/product/segment/:segment([A-Za-z0-9%_\ ]+)/category', auth.checkAPIAuth, product.getAllCategories);
app.get(prefix + '/product/segment', auth.checkAPIAuth, product.getAllSegments);
app.get(prefix + '/product/status/:status([A-Za-z]+)/', auth.checkAPIAuth, product.getAllByStatus);
app.post(prefix + '/product/add', auth.checkAPIAuth, product.addProduct);
app.get(prefix + '/product/add', auth.checkAPIAuth, product.addProduct);
app.post(prefix + '/product/import', auth.checkAPIAuth, product.importProduct);
app.get(prefix + '/product/', auth.checkAPIAuth, product.getAll);

app.put(prefix + '/order/:order([a-z0-9-]+)/update', auth.checkAPIAuth,  order.updateOrder);
app.get(prefix + '/order/:order([a-z0-9-]+)/update', auth.checkAPIAuth,  order.updateOrder);
app.del(prefix + '/order/:order([a-z0-9-]+)/delete', auth.checkAPIAuth,  order.deleteOrder);
app.get(prefix + '/order/:order([a-z0-9-]+)/delete', auth.checkAPIAuth,  order.deleteOrder);
app.put(prefix + '/order/:order([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/update', auth.checkAPIAuth, orderHistory.updateHistory);
app.get(prefix + '/order/:order([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/update', auth.checkAPIAuth, orderHistory.updateHistory);
app.del(prefix + '/order/:order([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/delete', auth.checkAPIAuth, orderHistory.deleteHistory);
app.get(prefix + '/order/:order([a-z0-9-]+)/history/id/:id([a-z0-9-]+)/delete', auth.checkAPIAuth, orderHistory.deleteHistory);
app.post(prefix + '/order/:order([a-z0-9-]+)/history/add', auth.checkAPIAuth, orderHistory.addHistory);
app.get(prefix + '/order/:order([a-z0-9-]+)/history/add', auth.checkAPIAuth, orderHistory.addHistory);
app.get(prefix + '/order/:order([a-z0-9-]+)/history', auth.checkAPIAuth, orderHistory.getAll);
app.get(prefix + '/order/:order([a-z0-9-]+)/', auth.checkAPIAuth, order.getOrder);
app.get(prefix + '/order/status/:status([A-Za-z]+)/', auth.checkAPIAuth, order.getAllByStatus);
app.post(prefix + '/order/add', auth.checkAPIAuth, order.addOrder);
app.get(prefix + '/order/add', auth.checkAPIAuth, order.addOrder);
app.get(prefix + '/order/status', auth.checkAPIAuth,  order.getAllStatus);
app.get(prefix + '/order/', auth.checkAPIAuth,  order.getAll);

app.put(prefix + '/task/:task([a-z0-9-]+)/update', auth.checkAPIAuth,  task.updateTask);
app.get(prefix + '/task/:task([a-z0-9-]+)/update', auth.checkAPIAuth,  task.updateTask);
app.del(prefix + '/task/:task([a-z0-9-]+)/delete', auth.checkAPIAuth,  task.deleteTask);
app.get(prefix + '/task/:task([a-z0-9-]+)/delete', auth.checkAPIAuth,  task.deleteTask);
app.get(prefix + '/task/:task([a-z0-9-]+)/', auth.checkAPIAuth,  task.getTask);
app.get(prefix + '/task/status/:status([A-Za-z]+)/', auth.checkAPIAuth,  task.getTaskByStatus);
app.post(prefix + '/task/add', auth.checkAPIAuth,  task.addTask);
app.get(prefix + '/task/add', auth.checkAPIAuth,  task.addTask);
app.get(prefix + '/task/', auth.checkAPIAuth,  task.getAll);

app.put(prefix + '/calendar/:calendar([a-z0-9-]+)/update', auth.checkAPIAuth,  calendar.updateCalendar);
app.get(prefix + '/calendar/:calendar([a-z0-9-]+)/update', auth.checkAPIAuth,  calendar.updateCalendar);
app.del(prefix + '/calendar/:calendar([a-z0-9-]+)/delete', auth.checkAPIAuth, calendar.deleteCalendar);
app.get(prefix + '/calendar/:calendar([a-z0-9-]+)/delete', auth.checkAPIAuth, calendar.deleteCalendar);
app.post(prefix + '/calendar/add', auth.checkAPIAuth, calendar.addCalendar);
app.get(prefix + '/calendar/add', auth.checkAPIAuth, calendar.addCalendar);
app.get(prefix + '/calendar/', auth.checkAPIAuth,  calendar.getAll);

app.get(prefix + '/crm/profile/invite/:email/', auth.checkAPIAuth, crm.invite);
app.put(prefix + '/crm/profile/update', auth.checkAPIAuth, crm.updateAccount);
app.get(prefix + '/crm/profile/update', auth.checkAPIAuth, crm.updateAccount);
app.post(prefix + '/crm/profile/add', crm.addAccount);
app.get(prefix + '/crm/profile/add', crm.addAccount);
app.get(prefix + '/crm/profile/verify', crm.verifyAccount);
app.get(prefix + '/crm/profile/recover', crm.recoverAccount);
app.get(prefix + '/crm/whoami', auth.checkAPIAuth,  crm.whoami);

app.get(prefix + '/login', auth.loginAPI);

app.get(prefix + '/logout', auth.logoutAPI); 