const fs = require('fs');
let content = fs.readFileSync('src/components/Shop.tsx', 'utf8');

const target = `                    </div>
                  </div>
                  </div>
                )}
              </div>

              {/* Chamber instructions bottom */}`;

const replacement = `                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chamber instructions bottom */}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/Shop.tsx', content);
