from __future__ import annotations
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.utils.class_weight import compute_sample_weight

MODEL_SPECS={
 'logistic': lambda: Pipeline([('scale',StandardScaler()),('model',LogisticRegression(max_iter=300,class_weight='balanced',random_state=42))]),
 'random_forest': lambda: RandomForestClassifier(n_estimators=120,max_depth=14,min_samples_leaf=2,class_weight='balanced_subsample',n_jobs=-1,random_state=42),
 'extra_trees': lambda: ExtraTreesClassifier(n_estimators=140,max_depth=16,min_samples_leaf=2,class_weight='balanced',n_jobs=-1,random_state=42),
 'hist_gradient_boosting': lambda: HistGradientBoostingClassifier(max_iter=160,max_leaf_nodes=31,learning_rate=0.08,l2_regularization=1.0,random_state=42),
 'mlp': lambda: Pipeline([('scale',StandardScaler()),('model',MLPClassifier(hidden_layer_sizes=(48,24),activation='relu',alpha=1e-4,batch_size=512,learning_rate_init=2e-3,max_iter=30,early_stopping=True,random_state=42))])
}

def make_model(name, params=None):
    m=MODEL_SPECS[name]()
    if params: m.set_params(**params)
    return m
