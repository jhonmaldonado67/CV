class Dummy:
    def __init__(self, *args, **kwargs): pass
    def parse_version(self, *args, **kwargs): return "1.0"
    def require(self, *args, **kwargs): pass
    def get_distribution(self, *args, **kwargs): return self

__version__ = "1.0"
parse_version = Dummy().parse_version
require = Dummy().require
get_distribution = Dummy().get_distribution
