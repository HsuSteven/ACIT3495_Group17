import connexion
import yaml

app = connexion.AsyncApp(__name__, specification_dir='./')
app.add_api("auth.yaml", strict_validation=True, validate_responses=True)