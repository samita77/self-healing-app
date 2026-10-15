FROM python:3.12-slim

WORKDIR /app

# Dependencies first so code edits don't invalidate the pip layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
