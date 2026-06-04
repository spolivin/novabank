import os

from supabase import create_client

supabase_admin = create_client(
    os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
)
