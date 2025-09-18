import React, { useState, useCallback } from 'react';
import { FaCog } from 'react-icons/fa';
import { DeckardOptions } from '../types';
import { Button } from '../inputs';
import { Tooltip, Modal } from './';
import './Settings.styles.css';

interface SettingsProps {
  options: DeckardOptions;
  onChange: (options: Partial<DeckardOptions>) => void;
  siteKey?: string;
}

const Settings: React.FC<SettingsProps> = ({
  options,
  onChange,
  siteKey = typeof window !== 'undefined'
    ? window.location.hostname
    : 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOptionChange = useCallback(
    (key: keyof DeckardOptions, value: boolean | string) => {
      const newOptions = { [key]: value };
      onChange(newOptions);

      // Persist to localStorage with site-specific key
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `deckard-settings-${siteKey}`;

          const existingSettings = JSON.parse(
            localStorage.getItem(storageKey) || '{}'
          );

          const updatedSettings = { ...existingSettings, [key]: value };

          localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
        } catch (error) {
          console.warn('Failed to save settings to localStorage:', error);
        }
      }
    },
    [onChange, siteKey]
  );

  return (
    <>
      <Tooltip title="Settings" content="Configure schema display options">
        <Button
          variant="ghost"
          size="xs"
          className="settings-trigger"
          onClick={handleToggleOpen}
          aria-label="Schema display settings"
        >
          <FaCog />
        </Button>
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Display Settings"
        size="md"
        footer={
          <p className="settings-note">
            Settings are saved per-site and will persist between visits.
          </p>
        }
      >
        <div className="settings-section">
          <h4 className="settings-section-title">Examples</h4>
          <div className="settings-options">
            <label className="settings-option">
              <input
                type="checkbox"
                checked={options.includeExamples || false}
                onChange={e =>
                  handleOptionChange('includeExamples', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">Show examples</div>
                  <div className="settings-option-description">
                    Display code examples for properties when available
                  </div>
                </div>
              </div>
            </label>

            {options.includeExamples && (
              <label className="settings-option settings-sub-option">
                <input
                  type="checkbox"
                  checked={!options.examplesOnFocusOnly}
                  onChange={e =>
                    handleOptionChange('examplesOnFocusOnly', !e.target.checked)
                  }
                />
                <div className="settings-option-content">
                  <div className="settings-checkbox"></div>
                  <div className="settings-option-text">
                    <div className="settings-option-label">
                      Always show examples
                    </div>
                    <div className="settings-option-description">
                      Show examples for all expanded properties, not just
                      focused ones
                    </div>
                  </div>
                </div>
              </label>
            )}

            <div className="settings-option">
              <div className="settings-option-content">
                <div className="settings-option-text">
                  <div className="settings-option-label">
                    Default example language
                  </div>
                  <div className="settings-option-description">
                    Choose the default format for code examples
                  </div>
                  <div style={{ marginTop: 'var(--schema-space-sm)' }}>
                    <label className="settings-language-option">
                      <input
                        type="radio"
                        name="defaultExampleLanguage"
                        value="yaml"
                        checked={options.defaultExampleLanguage === 'yaml'}
                        onChange={() =>
                          handleOptionChange('defaultExampleLanguage', 'yaml')
                        }
                      />
                      <div className="settings-checkbox"></div>
                      <span>YAML</span>
                    </label>
                    <label className="settings-language-option">
                      <input
                        type="radio"
                        name="defaultExampleLanguage"
                        value="json"
                        checked={options.defaultExampleLanguage === 'json'}
                        onChange={() =>
                          handleOptionChange('defaultExampleLanguage', 'json')
                        }
                      />
                      <div className="settings-checkbox"></div>
                      <span>JSON</span>
                    </label>
                    <label className="settings-language-option">
                      <input
                        type="radio"
                        name="defaultExampleLanguage"
                        value="toml"
                        checked={options.defaultExampleLanguage === 'toml'}
                        onChange={() =>
                          handleOptionChange('defaultExampleLanguage', 'toml')
                        }
                      />
                      <div className="settings-checkbox"></div>
                      <span>TOML</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-section">
          <h4 className="settings-section-title">Navigation</h4>
          <div className="settings-options">
            <label className="settings-option">
              <input
                type="checkbox"
                checked={Boolean(options.searchable) === true}
                onChange={e =>
                  handleOptionChange('searchable', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">Enable search</div>
                  <div className="settings-option-description">
                    Show search box to filter properties
                  </div>
                </div>
              </div>
            </label>

            {options.searchable && (
              <label className="settings-option settings-sub-option">
                <input
                  type="checkbox"
                  checked={options.searchIncludesExamples || false}
                  onChange={e =>
                    handleOptionChange(
                      'searchIncludesExamples',
                      e.target.checked
                    )
                  }
                />
                <div className="settings-option-content">
                  <div className="settings-checkbox"></div>
                  <div className="settings-option-text">
                    <div className="settings-option-label">
                      Search examples content
                    </div>
                    <div className="settings-option-description">
                      Include example values when searching properties
                    </div>
                  </div>
                </div>
              </label>
            )}

            <label className="settings-option">
              <input
                type="checkbox"
                checked={options.collapsible !== false}
                onChange={e =>
                  handleOptionChange('collapsible', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">
                    Collapsible properties
                  </div>
                  <div className="settings-option-description">
                    Allow expanding and collapsing property details
                  </div>
                </div>
              </div>
            </label>

            <label className="settings-option">
              <input
                type="checkbox"
                checked={options.autoExpand || false}
                onChange={e =>
                  handleOptionChange('autoExpand', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">Auto-expand</div>
                  <div className="settings-option-description">
                    Expand all properties by default
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
        <div className="settings-section">
          <h4 className="settings-section-title">Display</h4>
          <div className="settings-options">
            <label className="settings-option">
              <input
                type="checkbox"
                checked={options.includeHeader !== false}
                onChange={e =>
                  handleOptionChange('includeHeader', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">Show header</div>
                  <div className="settings-option-description">
                    Display schema title and description
                  </div>
                </div>
              </div>
            </label>

            <label className="settings-option">
              <input
                type="checkbox"
                checked={options.includePropertiesTitle !== false}
                onChange={e =>
                  handleOptionChange('includePropertiesTitle', e.target.checked)
                }
              />
              <div className="settings-option-content">
                <div className="settings-checkbox"></div>
                <div className="settings-option-text">
                  <div className="settings-option-label">
                    Show &ldquo;Properties&rdquo; title
                  </div>
                  <div className="settings-option-description">
                    Display the &ldquo;Properties&rdquo; section heading
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Settings;
