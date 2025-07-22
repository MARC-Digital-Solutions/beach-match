import { BeachEvent, PieceType } from './types';

export class EventManager {
  private static activeEvents: BeachEvent[] = [];
  private static eventCheckInterval: NodeJS.Timeout | null = null;

  static initializeEvents() {
    this.loadActiveEvents();
    this.startEventMonitoring();
  }

  private static loadActiveEvents() {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('beach-match-events');
      if (saved) {
        const events = JSON.parse(saved);
        this.activeEvents = events.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime)
        }));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }

    // Add default events if none exist
    if (this.activeEvents.length === 0) {
      this.createDefaultEvents();
    }
  }

  private static saveActiveEvents() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('beach-match-events', JSON.stringify(this.activeEvents));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  private static createDefaultEvents() {
    const now = new Date();
    
    // Weekend Beach Party (Saturdays and Sundays)
    if (now.getDay() === 0 || now.getDay() === 6) {
      this.activeEvents.push({
        id: 'weekend-party',
        type: 'beach_party',
        name: 'Weekend Beach Party',
        description: 'Double points all weekend long!',
        isActive: true,
        startTime: new Date(now.getTime() - 60000), // Started 1 minute ago
        endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        effects: {
          scoreMultiplier: 2.0,
          specialBackground: true
        }
      });
    }

    // Happy Hour (5 PM - 7 PM local time)
    const hour = now.getHours();
    if (hour >= 17 && hour < 19) {
      const endTime = new Date(now);
      endTime.setHours(19, 0, 0, 0);
      
      this.activeEvents.push({
        id: 'happy-hour',
        type: 'happy_hour',
        name: 'Happy Hour',
        description: 'Extra mini-game triggers and bonus points!',
        isActive: true,
        startTime: new Date(now.getTime() - 60000),
        endTime: endTime,
        effects: {
          powerUpChance: 0.5,
          scoreMultiplier: 1.5
        }
      });
    }

    // Late Night Mode (10 PM - 6 AM)
    if (hour >= 22 || hour < 6) {
      const endTime = new Date(now);
      if (hour >= 22) {
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(6, 0, 0, 0);
      } else {
        endTime.setHours(6, 0, 0, 0);
      }
      
      this.activeEvents.push({
        id: 'late-night',
        type: 'late_night',
        name: 'Late Night Chill',
        description: 'Peaceful mode with relaxing vibes',
        isActive: true,
        startTime: new Date(now.getTime() - 60000),
        endTime: endTime,
        effects: {
          specialBackground: true,
          scoreMultiplier: 1.2
        }
      });
    }

    // Rocket Launch Events (simulated - in real app this would be from NASA API)
    if (Math.random() < 0.1) { // 10% chance to have a rocket launch event
      this.activeEvents.push({
        id: 'rocket-launch',
        type: 'rocket_launch',
        name: 'Space Coast Rocket Launch',
        description: 'All rocket pieces become power-ups!',
        isActive: true,
        startTime: new Date(now.getTime() - 30000), // Started 30 seconds ago
        endTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour duration
        effects: {
          pieceBonus: 'rocket',
          powerUpChance: 0.8,
          scoreMultiplier: 1.3
        }
      });
    }

    this.saveActiveEvents();
  }

  private static startEventMonitoring() {
    if (this.eventCheckInterval) {
      clearInterval(this.eventCheckInterval);
    }

    // Check events every minute
    this.eventCheckInterval = setInterval(() => {
      this.updateActiveEvents();
    }, 60000);

    // Initial check
    this.updateActiveEvents();
  }

  private static updateActiveEvents() {
    const now = new Date();
    let eventsChanged = false;

    // Deactivate expired events
    this.activeEvents = this.activeEvents.map(event => {
      if (event.isActive && now > event.endTime) {
        eventsChanged = true;
        console.log(`Event ${event.name} has ended`);
        return { ...event, isActive: false };
      }
      return event;
    });

    // Create new time-based events
    this.createTimeBasedEvents();

    if (eventsChanged) {
      this.saveActiveEvents();
    }
  }

  private static createTimeBasedEvents() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Check for sunny day bonus (based on weather API in real app)
    const isSunnyDay = Math.random() < 0.3; // 30% chance - would be real weather data
    const existingSunnyDay = this.activeEvents.find(e => e.type === 'sunny_day' && e.isActive);
    
    if (isSunnyDay && !existingSunnyDay) {
      const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
      this.activeEvents.push({
        id: `sunny-day-${now.getTime()}`,
        type: 'sunny_day',
        name: 'Beautiful Sunny Day',
        description: 'Perfect beach weather means bonus points!',
        isActive: true,
        startTime: now,
        endTime: endTime,
        effects: {
          scoreMultiplier: 1.25,
          specialBackground: true
        }
      });
      console.log('Sunny day event started!');
    }

    // Hurricane Watch (very rare event)
    const isHurricaneWatch = Math.random() < 0.01; // 1% chance
    const existingHurricane = this.activeEvents.find(e => e.type === 'hurricane_watch' && e.isActive);
    
    if (isHurricaneWatch && !existingHurricane) {
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      this.activeEvents.push({
        id: `hurricane-watch-${now.getTime()}`,
        type: 'hurricane_watch',
        name: 'Hurricane Watch',
        description: 'Stormy weather brings swirling bonuses!',
        isActive: true,
        startTime: now,
        endTime: endTime,
        effects: {
          powerUpChance: 0.6,
          scoreMultiplier: 1.8,
          specialBackground: true
        }
      });
      console.log('Hurricane Watch event started!');
    }
  }

  static getActiveEvents(): BeachEvent[] {
    return this.activeEvents.filter(event => event.isActive);
  }

  static getScoreMultiplier(): number {
    let multiplier = 1.0;
    
    this.getActiveEvents().forEach(event => {
      if (event.effects.scoreMultiplier) {
        multiplier *= event.effects.scoreMultiplier;
      }
    });

    return multiplier;
  }

  static getPowerUpChanceBonus(): number {
    let bonus = 0;
    
    this.getActiveEvents().forEach(event => {
      if (event.effects.powerUpChance) {
        bonus += event.effects.powerUpChance;
      }
    });

    return Math.min(bonus, 0.8); // Cap at 80% bonus
  }

  static getBonusPieceType(): PieceType | null {
    const activeEvent = this.getActiveEvents().find(event => event.effects.pieceBonus);
    return activeEvent ? activeEvent.effects.pieceBonus || null : null;
  }

  static shouldShowSpecialBackground(): boolean {
    return this.getActiveEvents().some(event => event.effects.specialBackground);
  }

  static createCustomEvent(event: Omit<BeachEvent, 'id' | 'isActive'>): string {
    const id = `custom-${Date.now()}-${Math.random()}`;
    const customEvent: BeachEvent = {
      ...event,
      id,
      isActive: true
    };

    this.activeEvents.push(customEvent);
    this.saveActiveEvents();
    
    console.log(`Custom event ${event.name} created`);
    return id;
  }

  static endEvent(eventId: string): boolean {
    const eventIndex = this.activeEvents.findIndex(e => e.id === eventId);
    if (eventIndex >= 0) {
      this.activeEvents[eventIndex] = {
        ...this.activeEvents[eventIndex],
        isActive: false,
        endTime: new Date()
      };
      this.saveActiveEvents();
      console.log(`Event ${eventId} ended manually`);
      return true;
    }
    return false;
  }

  static cleanup() {
    if (this.eventCheckInterval) {
      clearInterval(this.eventCheckInterval);
      this.eventCheckInterval = null;
    }
  }

  static getEventBackground(eventType: BeachEvent['type']): string {
    switch (eventType) {
      case 'rocket_launch':
        return 'bg-gradient-to-b from-blue-900 via-purple-900 to-red-900';
      case 'hurricane_watch':
        return 'bg-gradient-to-b from-gray-800 via-gray-600 to-blue-800';
      case 'sunny_day':
        return 'bg-gradient-to-b from-yellow-200 via-orange-300 to-blue-400';
      case 'beach_party':
        return 'bg-gradient-to-b from-pink-400 via-purple-500 to-blue-500';
      case 'happy_hour':
        return 'bg-gradient-to-b from-orange-300 via-yellow-400 to-green-400';
      case 'late_night':
        return 'bg-gradient-to-b from-purple-900 via-blue-900 to-black';
      default:
        return 'bg-gradient-to-b from-blue-400 via-cyan-300 to-blue-500';
    }
  }
} 