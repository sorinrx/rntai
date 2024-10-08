from datetime import datetime, timedelta

def get_current_time_with_offset():
    """
    Returns the current UTC time plus a 3-hour offset.
    """
    # Obține data și ora curentă în UTC
    current_time = datetime.utcnow()
    # Adaugă 3 ore
    offset_time = current_time + timedelta(hours=3)
    # Formatează timpul cu offset în formatul 'YYYY-MM-DD HH:MM:SS'
    return offset_time.strftime("%Y-%m-%d %H:%M:%S")

if __name__ == "__main__":
    # Afișează timpul curent cu offset de 3 ore
    print(get_current_time_with_offset())