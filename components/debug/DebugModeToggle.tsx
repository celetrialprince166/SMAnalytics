/**
 * Debug Mode Toggle Component
 * 
 * Floating toggle button to enable/disable debug mode
 */

'use client';

import { useDebugMode } from '@/lib/contexts/DebugModeContext';
import { Button } from '@/components/ui/button';
import { Bug, BugOff, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function DebugModeToggle() {
  const { settings, updateSettings, toggleDebugMode } = useDebugMode();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            title="Debug Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-3">Debug Visualization Settings</h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-show">Auto-show after transaction</Label>
                <Switch
                  id="auto-show"
                  checked={settings.autoShow}
                  onCheckedChange={(checked) => updateSettings({ autoShow: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-balances">Show balances</Label>
                <Switch
                  id="show-balances"
                  checked={settings.showBalances}
                  onCheckedChange={(checked) => updateSettings({ showBalances: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-codes">Show account codes</Label>
                <Switch
                  id="show-codes"
                  checked={settings.showAccountCodes}
                  onCheckedChange={(checked) => updateSettings({ showAccountCodes: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-numbers">Show transaction numbers</Label>
                <Switch
                  id="show-numbers"
                  checked={settings.showTransactionNumbers}
                  onCheckedChange={(checked) => updateSettings({ showTransactionNumbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animate">Animate flows</Label>
                <Switch
                  id="animate"
                  checked={settings.animateFlows}
                  onCheckedChange={(checked) => updateSettings({ animateFlows: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <RadioGroup
                value={settings.layout}
                onValueChange={(value: 'horizontal' | 'vertical') => 
                  updateSettings({ layout: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="horizontal" id="horizontal" />
                  <Label htmlFor="horizontal" className="font-normal">
                    Horizontal (Left → Right)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vertical" id="vertical" />
                  <Label htmlFor="vertical" className="font-normal">
                    Vertical (Top → Bottom)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <RadioGroup
                value={settings.colorScheme}
                onValueChange={(value: any) => updateSettings({ colorScheme: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="account-type" id="account-type" />
                  <Label htmlFor="account-type" className="font-normal">
                    By Account Type
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balance-change" id="balance-change" />
                  <Label htmlFor="balance-change" className="font-normal">
                    By Balance Change
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combined" id="combined" />
                  <Label htmlFor="combined" className="font-normal">
                    Combined (Recommended)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
              <p>Keyboard shortcut: <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+D</kbd></p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Main Toggle Button */}
      <Button
        variant={settings.enabled ? 'default' : 'outline'}
        size="lg"
        onClick={toggleDebugMode}
        className="rounded-full shadow-lg"
        title={settings.enabled ? 'Disable Debug Mode' : 'Enable Debug Mode'}
      >
        {settings.enabled ? (
          <>
            <Bug className="h-5 w-5 mr-2" />
            Debug ON
          </>
        ) : (
          <>
            <BugOff className="h-5 w-5 mr-2" />
            Debug OFF
          </>
        )}
      </Button>
    </div>
  );
}
