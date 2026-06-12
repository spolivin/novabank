from supabase import create_client

from config import settings

supabase_admin = create_client(
    str(settings.supabase_url).rstrip("/"), settings.supabase_service_key
)
