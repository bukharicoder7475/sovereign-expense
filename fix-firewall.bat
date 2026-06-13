@echo off
echo Adding firewall rules for Sovereign...
netsh advfirewall firewall add rule name="Sovereign Frontend 3000" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="Sovereign Backend 5000" dir=in action=allow protocol=tcp localport=5000
echo Done! You can close this window.
pause
