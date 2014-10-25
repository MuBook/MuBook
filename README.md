# How to test the server on your own computer

## Things you need to have

* Python 2.7
* Django 1.6.0+
* Postgres DB
* Maybe: things mentioned in `requirements.txt`

## What need to be done

* OPTIONAL: Put test data into your own DB
	- Command: `pg_restore --verbose --clean --no-acl --no-owner -h localhost -U USER_NAME -d DB_NAME DUMP_NAME.dump`
	- make sure postgres bin folder is in your PATH
	- USER_NAME: your user name for your db
	- DB_NAME: your db name in postgres
	- DUMP_NAME: the file name of the dump file, in this case, `xdb`
	- [download xdb.dump](https://s3-ap-southeast-2.amazonaws.com/pochen-temp/xdb.dump)
* MANDATORY: create a .env file in the django project folder (`/xbook`) like below
```
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

* CACHE TRICK: should now be gone with the environment aware settings

* run this command `python manage.py runserver`
	- then open browser, go to http://127.0.0.1:8000/

# Admin Login

## Production
username: mubookadmin
password: dawsonkhkzpo

##Testing
username: mubookadmin
password: dawsonkhkzpo

# How to update the database

- [Heroku documentation link](https://devcenter.heroku.com/articles/heroku-postgres-import-export)

tell me if you need more instructions
