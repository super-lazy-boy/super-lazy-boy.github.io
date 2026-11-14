"""Build original, editable miniature studies from the documented references."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from collectible_monica import build as monica
from collectible_falcon import build as falcon
from collectible_willow import build as willow
from collectible_zaizen_lighter import build as lighter

for name,fn in [('monica-apartment',monica),('millennium-falcon',falcon),('wish-willow',willow),('zaizen-lighter',lighter)]:
    if '--only' in sys.argv and name not in sys.argv[sys.argv.index('--only')+1:]:continue
    print('BUILDING_COLLECTIBLE',name,flush=True);fn()
