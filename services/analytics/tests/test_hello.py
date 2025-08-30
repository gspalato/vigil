"""Hello unit test module."""

from services/analytics.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello services/analytics"
