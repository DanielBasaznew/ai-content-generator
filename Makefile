.PHONY: film test clean

film:
	python make_film.py

test:
	pytest -v

clean:
	python -c "import shutil, os; [shutil.rmtree(p) for p in ['outputs/intermediate', '.pytest_cache'] if os.path.exists(p)]"
