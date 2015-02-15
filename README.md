# Development instructions

## Things you need to have

* Python 2.7+
* Django 1.7+
* Postgres DB
* required python modules: `pip install -r requirements.txt`
* node.js and npm dependencies: `npm install`

## Assets compilation

	gulp

This command will pick up `gulpfile.js` and run the default command, which I've set to lint the js and compile both js and css

If you are working on js or css changes, make sure you run `gulp watch` along with `python manage.py runserver` (in different terminal sessions of course). Gulp will automatically pick up changs you made in the files and re-compile the assets.

For more information, read `gulpfile.js`

## Local setup

* OPTIONAL: Put test data into your own DB
	- Command: `pg_restore --verbose --clean --no-acl --no-owner -h localhost -U USER_NAME -d DB_NAME DUMP_NAME.dump`
	- make sure postgres bin folder is in your PATH
	- USER_NAME: your user name for your db
	- DB_NAME: your db name in postgres
	- DUMP_NAME: the file name of the dump file, in this case, `xdb`
	- [download xdb.dump](https://s3-ap-southeast-2.amazonaws.com/pochen-temp/xdb.dump)
* MANDATORY: create a .env file in the django project folder (the same level as `manage.py`) like below
```
DB_NAME=your_postgres_db_name
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
MUBOOK_DEBUG=TRUE
```
Exclude the last line if you want to turn off debugging

* CACHE TRICK: should now be gone with the environment aware settings

* run this command `python manage.py runserver`
	- then open browser, go to http://127.0.0.1:8000/

# How to update the database

- [Heroku documentation link](https://devcenter.heroku.com/articles/heroku-postgres-import-export)
