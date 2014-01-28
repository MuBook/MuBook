# How to test the server on your own computer

## Things you need to have

* Python 2.7
* Django 1.5.1
* Postgres DB
* Maybe: things mentioned in `requirements.txt`

## What need to be done

* OPTIONAL: Put test data into your own DB
	- Command: pg_restore --verbose --clean --no-acl --no-owner -h localhost -U USER_NAME -d DB_NAME DUMP_NAME.dump
	- make sure postgres bin folder is in your PATH
	- USER_NAME: your user name for your db
	- DB_NAME: your db name in postgres
	- DUMP_NAME: the file name of the dump file, in this case, `xdb`
	- [download xdb.dump](https://s3-ap-southeast-2.amazonaws.com/pochen-temp/xdb.dump)
* MANDATORY: Comment out this line in `settings.py` in the django project folder
	- this line is for Heroku server
	- so uncomment this line before you add/commit

```python
DATABASES['default'] = dj_database_url.config()
```

* TRICK: `index.html` is cached
	- if changes are made, they are not shown until you restart server
	- when testing locally, look into `front/views.py -> index`
	- I have comments there saying what to do
	- don't forget to change it back, like `settings.py`


* Change db setting in `settings.py` to match your environment
	- `DATABASE`, NAME, USER, PASSWORD
* run this command `python manage.py runserver`
	- then open browser, go to http://127.0.0.1:8000/

#### By PO CHEN