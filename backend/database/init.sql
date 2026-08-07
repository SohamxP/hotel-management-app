PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS trg_max_guests;
DROP TRIGGER IF EXISTS trg_emp_one_service;
DROP TRIGGER IF EXISTS trg_emp_one_service_update;
DROP TRIGGER IF EXISTS trg_feedback_date;
DROP TRIGGER IF EXISTS trg_no_blocked_booking;

DROP TABLE IF EXISTS Feedback;
DROP TABLE IF EXISTS ShuttleService;
DROP TABLE IF EXISTS SpaService;
DROP TABLE IF EXISTS RoomService;
DROP TABLE IF EXISTS Service;
DROP TABLE IF EXISTS ReservationGuest;
DROP TABLE IF EXISTS Reservation;
DROP TABLE IF EXISTS PaymentInfo;
DROP TABLE IF EXISTS Membership;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Guest;
DROP TABLE IF EXISTS Room;

PRAGMA foreign_keys = ON;

CREATE TABLE Room (
  RoomNumber INTEGER PRIMARY KEY,
  RoomType TEXT NOT NULL CHECK (RoomType IN ('King','Queen','Deluxe','Accessible')),
  RatePerNight REAL NOT NULL,
  AvailStatus TEXT NOT NULL CHECK (AvailStatus IN ('Available','Reserved','Occupied','Blocked')),
  MaxOccupancy INTEGER NOT NULL,
  HasBalcony TEXT DEFAULT 'N' CHECK (HasBalcony IN ('Y','N')),
  IsSmoking TEXT DEFAULT 'N' CHECK (IsSmoking IN ('Y','N')),
  BedCount INTEGER NOT NULL,
  BuildingNumber INTEGER NOT NULL,
  HasWifi TEXT DEFAULT 'Y' CHECK (HasWifi IN ('Y','N')),
  HasTv TEXT DEFAULT 'Y' CHECK (HasTv IN ('Y','N'))
);

CREATE TABLE Guest (
  GuestID INTEGER PRIMARY KEY,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  DateOfBirth TEXT NOT NULL,
  PhoneNumber TEXT NOT NULL UNIQUE,
  Email TEXT NOT NULL UNIQUE
);

CREATE TABLE Membership (
  MembershipID INTEGER PRIMARY KEY,
  GuestID INTEGER NOT NULL UNIQUE,
  MembershipLevel TEXT NOT NULL CHECK (MembershipLevel IN ('Bronze','Silver','Gold','Platinum')),
  PreferredRoomType TEXT CHECK (PreferredRoomType IN ('King','Queen','Deluxe','Accessible')),
  PurposeOfVisit TEXT CHECK (PurposeOfVisit IN ('Business','Leisure','Travel','Nearby Attractions','Social Gathering')),
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
);

CREATE TABLE PaymentInfo (
  PaymentID INTEGER PRIMARY KEY,
  GuestID INTEGER NOT NULL,
  CardType TEXT NOT NULL CHECK (CardType IN ('Visa','MasterCard','Amex','Discover','Cash','Bank Transfer')),
  CardLastFour TEXT,
  BillingAddress TEXT,
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
);

CREATE TABLE Employee (
  EmployeeID INTEGER PRIMARY KEY,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  DateOfBirth TEXT NOT NULL,
  SSN TEXT NOT NULL UNIQUE,
  Salary REAL NOT NULL CHECK (Salary > 0),
  Position TEXT NOT NULL,
  HoursWorked REAL DEFAULT 0
);

CREATE TABLE UserAccount (
  UserID INTEGER PRIMARY KEY AUTOINCREMENT,
  EmployeeID INTEGER NOT NULL UNIQUE,
  Username TEXT NOT NULL UNIQUE,
  PasswordHash TEXT NOT NULL,
  IsActive INTEGER NOT NULL DEFAULT 1 CHECK (IsActive IN (0, 1)),
  CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE Reservation (
  ReservationID INTEGER PRIMARY KEY,
  GuestID INTEGER NOT NULL,
  RoomNumber INTEGER NOT NULL,
  CheckInDate TEXT NOT NULL,
  CheckInTime TEXT DEFAULT '15:00',
  CheckOutDate TEXT NOT NULL,
  TotalPrice REAL NOT NULL,
  ReservStatus TEXT NOT NULL CHECK (ReservStatus IN ('Confirmed','Pending','Cancelled','Completed','No-Show')),
  SpecialRequest TEXT,
  PaymentMode TEXT NOT NULL CHECK (PaymentMode IN ('Credit Card','Debit Card','Cash','Bank Transfer','Amex')),
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID),
  FOREIGN KEY (RoomNumber) REFERENCES Room(RoomNumber),
  CHECK (CheckOutDate > CheckInDate)
);

CREATE TABLE ReservationGuest (
  ReservationID INTEGER NOT NULL,
  GuestID INTEGER NOT NULL,
  PRIMARY KEY (ReservationID, GuestID),
  FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID),
  FOREIGN KEY (GuestID) REFERENCES Guest(GuestID)
);

CREATE TABLE Service (
  ServiceID INTEGER PRIMARY KEY,
  ReservationID INTEGER NOT NULL,
  ServiceType TEXT NOT NULL CHECK (ServiceType IN ('Room Service','Spa','Shuttle')),
  RequestTime TEXT DEFAULT CURRENT_TIMESTAMP,
  RequestStatus TEXT NOT NULL CHECK (RequestStatus IN ('Pending','In Progress','Completed','Cancelled')),
  ServicePrice REAL NOT NULL CHECK (ServicePrice >= 0),
  EmployeeID INTEGER,
  FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID),
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE RoomService (
  ServiceID INTEGER PRIMARY KEY,
  RoomNumber INTEGER NOT NULL,
  ItemDescription TEXT,
  FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID),
  FOREIGN KEY (RoomNumber) REFERENCES Room(RoomNumber)
);

CREATE TABLE SpaService (
  ServiceID INTEGER PRIMARY KEY,
  SpaServiceType TEXT NOT NULL,
  DurationMinutes INTEGER,
  FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID)
);

CREATE TABLE ShuttleService (
  ServiceID INTEGER PRIMARY KEY,
  PickupTime TEXT NOT NULL,
  DropoffTime TEXT,
  ArrivalDestination TEXT NOT NULL,
  DepartureDestination TEXT NOT NULL,
  NumberOfPeople INTEGER NOT NULL CHECK (NumberOfPeople >= 1),
  FOREIGN KEY (ServiceID) REFERENCES Service(ServiceID)
);

CREATE TABLE Feedback (
  FeedbackID INTEGER PRIMARY KEY,
  ReservationID INTEGER NOT NULL,
  RoomRating INTEGER CHECK (RoomRating BETWEEN 1 AND 5),
  BreakfastRating INTEGER CHECK (BreakfastRating BETWEEN 1 AND 5),
  SafetyRating INTEGER CHECK (SafetyRating BETWEEN 1 AND 5),
  CustSvcRating INTEGER CHECK (CustSvcRating BETWEEN 1 AND 5),
  Comments TEXT,
  SubmissionDate TEXT DEFAULT CURRENT_DATE,
  FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID)
);

CREATE TRIGGER trg_max_guests
BEFORE INSERT ON ReservationGuest
FOR EACH ROW
WHEN (SELECT COUNT(*) FROM ReservationGuest WHERE ReservationID = NEW.ReservationID) >= 4
BEGIN
  SELECT RAISE(ABORT, 'A reservation cannot have more than 4 guests.');
END;

CREATE TRIGGER trg_room_on_reserve
AFTER INSERT ON Reservation
FOR EACH ROW
WHEN NEW.ReservStatus IN ('Confirmed','Pending')
BEGIN
  UPDATE Room SET AvailStatus = 'Reserved' WHERE RoomNumber = NEW.RoomNumber;
END;

CREATE TRIGGER trg_room_on_update
AFTER UPDATE OF ReservStatus ON Reservation
FOR EACH ROW
WHEN NEW.ReservStatus IN ('Completed','Cancelled','No-Show')
BEGIN
  UPDATE Room SET AvailStatus = 'Available' WHERE RoomNumber = NEW.RoomNumber;
END;

CREATE TRIGGER trg_room_on_update_confirmed
AFTER UPDATE OF ReservStatus ON Reservation
FOR EACH ROW
WHEN NEW.ReservStatus = 'Confirmed'
BEGIN
  UPDATE Room SET AvailStatus = 'Occupied' WHERE RoomNumber = NEW.RoomNumber;
END;

CREATE TRIGGER trg_emp_one_service
BEFORE INSERT ON Service
FOR EACH ROW
WHEN NEW.EmployeeID IS NOT NULL AND (
  SELECT COUNT(*) FROM Service
  WHERE EmployeeID = NEW.EmployeeID
    AND RequestStatus = 'In Progress'
    AND ServiceID != NEW.ServiceID
) >= 1
BEGIN
  SELECT RAISE(ABORT, 'Employee is already handling an active service request.');
END;

CREATE TRIGGER trg_emp_one_service_update
BEFORE UPDATE OF EmployeeID ON Service
FOR EACH ROW
WHEN NEW.EmployeeID IS NOT NULL AND (
  SELECT COUNT(*) FROM Service
  WHERE EmployeeID = NEW.EmployeeID
    AND RequestStatus = 'In Progress'
    AND ServiceID != NEW.ServiceID
) >= 1
BEGIN
  SELECT RAISE(ABORT, 'Employee is already handling an active service request.');
END;

CREATE TRIGGER trg_feedback_date
BEFORE INSERT ON Feedback
FOR EACH ROW
WHEN NEW.SubmissionDate < (SELECT CheckOutDate FROM Reservation WHERE ReservationID = NEW.ReservationID)
BEGIN
  SELECT RAISE(ABORT, 'Feedback cannot be submitted before the check-out date.');
END;

CREATE TRIGGER trg_no_blocked_booking
BEFORE INSERT ON Reservation
FOR EACH ROW
WHEN (SELECT AvailStatus FROM Room WHERE RoomNumber = NEW.RoomNumber) = 'Blocked'
BEGIN
  SELECT RAISE(ABORT, 'Cannot reserve a room that is currently Blocked.');
END;

-- DATA FROM projectDBinsert.sql
-- ============================================================
-- Hotel Database Management System
-- DML INSERT Script — projectDBinsert.sql
-- Section: 008  |  Team: 13  |  Spring 2026
-- Prefix: 
-- ============================================================

-- ============================================================
-- Room  (50 rows | RoomNumber range: 90101 - 90510)
-- ============================================================
INSERT INTO Room VALUES (90101,'King',      250.00,'Available',2,'Y','N',1,1,'Y','Y');
INSERT INTO Room VALUES (90102,'Queen',     180.00,'Available',2,'N','N',2,1,'Y','Y');
INSERT INTO Room VALUES (90103,'Deluxe',    320.00,'Available',3,'Y','N',2,1,'Y','Y');
INSERT INTO Room VALUES (90104,'Accessible',150.00,'Available',2,'N','N',1,1,'Y','Y');
INSERT INTO Room VALUES (90105,'King',      260.00,'Available',2,'Y','Y',1,1,'Y','Y');
INSERT INTO Room VALUES (90106,'Queen',     190.00,'Blocked',  2,'N','N',2,1,'Y','Y');
INSERT INTO Room VALUES (90107,'Deluxe',    330.00,'Available',4,'Y','N',2,1,'Y','Y');
INSERT INTO Room VALUES (90108,'King',      255.00,'Available',2,'N','N',1,1,'Y','Y');
INSERT INTO Room VALUES (90109,'Queen',     185.00,'Available',2,'Y','N',2,1,'Y','Y');
INSERT INTO Room VALUES (90110,'Accessible',160.00,'Available',2,'N','N',1,1,'N','Y');
INSERT INTO Room VALUES (90201,'King',      270.00,'Available',2,'Y','N',1,2,'Y','Y');
INSERT INTO Room VALUES (90202,'Queen',     195.00,'Available',2,'N','N',2,2,'Y','Y');
INSERT INTO Room VALUES (90203,'Deluxe',    340.00,'Available',3,'Y','Y',2,2,'Y','Y');
INSERT INTO Room VALUES (90204,'King',      265.00,'Available',2,'Y','N',1,2,'Y','Y');
INSERT INTO Room VALUES (90205,'Queen',     200.00,'Available',2,'N','N',2,2,'Y','Y');
INSERT INTO Room VALUES (90206,'Accessible',155.00,'Available',2,'N','N',1,2,'N','Y');
INSERT INTO Room VALUES (90207,'Deluxe',    350.00,'Available',4,'Y','N',2,2,'Y','Y');
INSERT INTO Room VALUES (90208,'King',      275.00,'Available',2,'Y','Y',1,2,'Y','Y');
INSERT INTO Room VALUES (90209,'Queen',     190.00,'Available',2,'N','N',2,2,'Y','Y');
INSERT INTO Room VALUES (90210,'Accessible',165.00,'Available',2,'N','N',1,2,'Y','N');
INSERT INTO Room VALUES (90301,'King',      280.00,'Available',2,'Y','N',1,3,'Y','Y');
INSERT INTO Room VALUES (90302,'Queen',     205.00,'Available',2,'N','N',2,3,'Y','Y');
INSERT INTO Room VALUES (90303,'Deluxe',    360.00,'Available',3,'Y','N',2,3,'Y','Y');
INSERT INTO Room VALUES (90304,'King',      285.00,'Available',2,'Y','Y',1,3,'Y','Y');
INSERT INTO Room VALUES (90305,'Queen',     210.00,'Available',2,'N','N',2,3,'Y','Y');
INSERT INTO Room VALUES (90306,'Accessible',170.00,'Available',2,'N','N',1,3,'Y','Y');
INSERT INTO Room VALUES (90307,'Deluxe',    370.00,'Available',4,'Y','N',2,3,'Y','Y');
INSERT INTO Room VALUES (90308,'King',      290.00,'Available',2,'Y','N',1,3,'Y','Y');
INSERT INTO Room VALUES (90309,'Queen',     215.00,'Available',2,'N','Y',2,3,'Y','Y');
INSERT INTO Room VALUES (90310,'Accessible',175.00,'Available',2,'N','N',1,3,'N','Y');
INSERT INTO Room VALUES (90401,'King',      300.00,'Available',2,'Y','N',1,4,'Y','Y');
INSERT INTO Room VALUES (90402,'Queen',     220.00,'Available',2,'N','N',2,4,'Y','Y');
INSERT INTO Room VALUES (90403,'Deluxe',    380.00,'Available',3,'Y','Y',2,4,'Y','Y');
INSERT INTO Room VALUES (90404,'King',      310.00,'Available',2,'Y','N',1,4,'Y','Y');
INSERT INTO Room VALUES (90405,'Queen',     225.00,'Available',2,'N','N',2,4,'Y','Y');
INSERT INTO Room VALUES (90406,'Accessible',180.00,'Available',2,'N','N',1,4,'Y','Y');
INSERT INTO Room VALUES (90407,'Deluxe',    390.00,'Available',4,'Y','N',2,4,'Y','Y');
INSERT INTO Room VALUES (90408,'King',      315.00,'Blocked',  2,'Y','Y',1,4,'Y','Y');
INSERT INTO Room VALUES (90409,'Queen',     230.00,'Available',2,'N','N',2,4,'Y','Y');
INSERT INTO Room VALUES (90410,'Accessible',185.00,'Available',2,'N','N',1,4,'N','Y');
INSERT INTO Room VALUES (90501,'King',      320.00,'Available',2,'Y','N',1,5,'Y','Y');
INSERT INTO Room VALUES (90502,'Queen',     235.00,'Available',2,'N','N',2,5,'Y','Y');
INSERT INTO Room VALUES (90503,'Deluxe',    400.00,'Available',3,'Y','N',2,5,'Y','Y');
INSERT INTO Room VALUES (90504,'King',      325.00,'Available',2,'Y','Y',1,5,'Y','Y');
INSERT INTO Room VALUES (90505,'Queen',     240.00,'Available',2,'N','N',2,5,'Y','Y');
INSERT INTO Room VALUES (90506,'Accessible',190.00,'Available',2,'N','N',1,5,'Y','Y');
INSERT INTO Room VALUES (90507,'Deluxe',    410.00,'Available',4,'Y','N',2,5,'Y','Y');
INSERT INTO Room VALUES (90508,'King',      330.00,'Available',2,'Y','N',1,5,'Y','Y');
INSERT INTO Room VALUES (90509,'Queen',     245.00,'Available',2,'N','Y',2,5,'Y','Y');
INSERT INTO Room VALUES (90510,'Accessible',195.00,'Available',2,'N','N',1,5,'Y','Y');

-- ============================================================
-- Guest  (50 rows | GuestID range: 91001 - 91050)
-- ============================================================
INSERT INTO Guest VALUES (91001,'James',      'Smith',      '1985-03-15','214-900-0101','james.smith@hms.com');
INSERT INTO Guest VALUES (91002,'Maria',      'Johnson',    '1990-07-22','214-900-0102','maria.johnson@hms.com');
INSERT INTO Guest VALUES (91003,'Robert',     'Williams',   '1978-11-05','214-900-0103','robert.williams@hms.com');
INSERT INTO Guest VALUES (91004,'Linda',      'Brown',      '1995-02-28','214-900-0104','linda.brown@hms.com');
INSERT INTO Guest VALUES (91005,'Michael',    'Jones',      '1982-09-10','214-900-0105','michael.jones@hms.com');
INSERT INTO Guest VALUES (91006,'Patricia',   'Davis',      '1970-04-17','214-900-0106','patricia.davis@hms.com');
INSERT INTO Guest VALUES (91007,'David',      'Miller',     '1988-12-03','214-900-0107','david.miller@hms.com');
INSERT INTO Guest VALUES (91008,'Barbara',    'Wilson',     '1993-06-25','214-900-0108','barbara.wilson@hms.com');
INSERT INTO Guest VALUES (91009,'Richard',    'Moore',      '1975-01-30','214-900-0109','richard.moore@hms.com');
INSERT INTO Guest VALUES (91010,'Susan',      'Taylor',     '1998-08-14','214-900-0110','susan.taylor@hms.com');
INSERT INTO Guest VALUES (91011,'Charles',    'Anderson',   '1965-05-07','214-900-0111','charles.anderson@hms.com');
INSERT INTO Guest VALUES (91012,'Jessica',    'Thomas',     '1992-10-19','214-900-0112','jessica.thomas@hms.com');
INSERT INTO Guest VALUES (91013,'Thomas',     'Jackson',    '1980-03-22','214-900-0113','thomas.jackson@hms.com');
INSERT INTO Guest VALUES (91014,'Sarah',      'White',      '1987-07-11','214-900-0114','sarah.white@hms.com');
INSERT INTO Guest VALUES (91015,'Christopher','Harris',     '1972-09-28','214-900-0115','christopher.harris@hms.com');
INSERT INTO Guest VALUES (91016,'Karen',      'Martin',     '1996-01-08','214-900-0116','karen.martin@hms.com');
INSERT INTO Guest VALUES (91017,'Daniel',     'Garcia',     '1984-04-15','214-900-0117','daniel.garcia@hms.com');
INSERT INTO Guest VALUES (91018,'Nancy',      'Martinez',   '1991-11-27','214-900-0118','nancy.martinez@hms.com');
INSERT INTO Guest VALUES (91019,'Matthew',    'Robinson',   '1977-06-02','214-900-0119','matthew.robinson@hms.com');
INSERT INTO Guest VALUES (91020,'Betty',      'Clark',      '1969-02-18','214-900-0120','betty.clark@hms.com');
INSERT INTO Guest VALUES (91021,'Anthony',    'Rodriguez',  '1994-08-30','214-900-0121','anthony.rodriguez@hms.com');
INSERT INTO Guest VALUES (91022,'Margaret',   'Lewis',      '1983-12-13','214-900-0122','margaret.lewis@hms.com');
INSERT INTO Guest VALUES (91023,'Mark',       'Lee',        '1979-05-06','214-900-0123','mark.lee@hms.com');
INSERT INTO Guest VALUES (91024,'Sandra',     'Walker',     '1997-03-24','214-900-0124','sandra.walker@hms.com');
INSERT INTO Guest VALUES (91025,'Donald',     'Hall',       '1968-10-09','214-900-0125','donald.hall@hms.com');
INSERT INTO Guest VALUES (91026,'Ashley',     'Allen',      '1999-07-16','214-900-0126','ashley.allen@hms.com');
INSERT INTO Guest VALUES (91027,'Steven',     'Young',      '1986-01-23','214-900-0127','steven.young@hms.com');
INSERT INTO Guest VALUES (91028,'Kimberly',   'Hernandez',  '1993-04-04','214-900-0128','kimberly.hernandez@hms.com');
INSERT INTO Guest VALUES (91029,'Paul',       'King',       '1976-09-17','214-900-0129','paul.king@hms.com');
INSERT INTO Guest VALUES (91030,'Emily',      'Wright',     '2000-02-08','214-900-0130','emily.wright@hms.com');
INSERT INTO Guest VALUES (91031,'Andrew',     'Lopez',      '1981-06-29','214-900-0131','andrew.lopez@hms.com');
INSERT INTO Guest VALUES (91032,'Donna',      'Hill',       '1974-11-14','214-900-0132','donna.hill@hms.com');
INSERT INTO Guest VALUES (91033,'Joshua',     'Scott',      '1989-03-03','214-900-0133','joshua.scott@hms.com');
INSERT INTO Guest VALUES (91034,'Carol',      'Green',      '1966-08-21','214-900-0134','carol.green@hms.com');
INSERT INTO Guest VALUES (91035,'Kenneth',    'Adams',      '1995-05-12','214-900-0135','kenneth.adams@hms.com');
INSERT INTO Guest VALUES (91036,'Michelle',   'Baker',      '1971-12-26','214-900-0136','michelle.baker@hms.com');
INSERT INTO Guest VALUES (91037,'Kevin',      'Gonzalez',   '1988-07-07','214-900-0137','kevin.gonzalez@hms.com');
INSERT INTO Guest VALUES (91038,'Amanda',     'Nelson',     '1992-04-19','214-900-0138','amanda.nelson@hms.com');
INSERT INTO Guest VALUES (91039,'Brian',      'Carter',     '1978-10-31','214-900-0139','brian.carter@hms.com');
INSERT INTO Guest VALUES (91040,'Melissa',    'Mitchell',   '1985-01-14','214-900-0140','melissa.mitchell@hms.com');
INSERT INTO Guest VALUES (91041,'George',     'Perez',      '1963-06-08','214-900-0141','george.perez@hms.com');
INSERT INTO Guest VALUES (91042,'Stephanie',  'Roberts',    '1990-09-22','214-900-0142','stephanie.roberts@hms.com');
INSERT INTO Guest VALUES (91043,'Timothy',    'Turner',     '1982-02-05','214-900-0143','timothy.turner@hms.com');
INSERT INTO Guest VALUES (91044,'Deborah',    'Phillips',   '1975-07-18','214-900-0144','deborah.phillips@hms.com');
INSERT INTO Guest VALUES (91045,'Ronald',     'Campbell',   '1967-11-30','214-900-0145','ronald.campbell@hms.com');
INSERT INTO Guest VALUES (91046,'Rebecca',    'Parker',     '1998-04-13','214-900-0146','rebecca.parker@hms.com');
INSERT INTO Guest VALUES (91047,'Larry',      'Evans',      '1980-08-27','214-900-0147','larry.evans@hms.com');
INSERT INTO Guest VALUES (91048,'Sharon',     'Edwards',    '1993-03-10','214-900-0148','sharon.edwards@hms.com');
INSERT INTO Guest VALUES (91049,'Jeffrey',    'Collins',    '1970-12-04','214-900-0149','jeffrey.collins@hms.com');
INSERT INTO Guest VALUES (91050,'Cynthia',    'Stewart',    '1987-05-23','214-900-0150','cynthia.stewart@hms.com');

-- ============================================================
-- Membership  (50 rows | MembershipID: 92001-92050)
-- ============================================================
INSERT INTO Membership VALUES (92001,91001,'Gold',    'King',      'Business');
INSERT INTO Membership VALUES (92002,91002,'Silver',  'Queen',     'Leisure');
INSERT INTO Membership VALUES (92003,91003,'Platinum','Deluxe',    'Business');
INSERT INTO Membership VALUES (92004,91004,'Bronze',  'Accessible','Travel');
INSERT INTO Membership VALUES (92005,91005,'Gold',    'King',      'Business');
INSERT INTO Membership VALUES (92006,91006,'Silver',  'Queen',     'Leisure');
INSERT INTO Membership VALUES (92007,91007,'Bronze',  'King',      'Social Gathering');
INSERT INTO Membership VALUES (92008,91008,'Gold',    'Deluxe',    'Leisure');
INSERT INTO Membership VALUES (92009,91009,'Platinum','King',      'Business');
INSERT INTO Membership VALUES (92010,91010,'Silver',  'Queen',     'Nearby Attractions');
INSERT INTO Membership VALUES (92011,91011,'Gold',    'Deluxe',    'Business');
INSERT INTO Membership VALUES (92012,91012,'Bronze',  'Queen',     'Leisure');
INSERT INTO Membership VALUES (92013,91013,'Silver',  'King',      'Travel');
INSERT INTO Membership VALUES (92014,91014,'Gold',    'Queen',     'Social Gathering');
INSERT INTO Membership VALUES (92015,91015,'Platinum','Deluxe',    'Business');
INSERT INTO Membership VALUES (92016,91016,'Bronze',  'Accessible','Nearby Attractions');
INSERT INTO Membership VALUES (92017,91017,'Silver',  'King',      'Business');
INSERT INTO Membership VALUES (92018,91018,'Gold',    'Queen',     'Leisure');
INSERT INTO Membership VALUES (92019,91019,'Bronze',  'Deluxe',    'Travel');
INSERT INTO Membership VALUES (92020,91020,'Silver',  'King',      'Nearby Attractions');
INSERT INTO Membership VALUES (92021,91021,'Gold',    'Queen',     'Social Gathering');
INSERT INTO Membership VALUES (92022,91022,'Platinum','Deluxe',    'Business');
INSERT INTO Membership VALUES (92023,91023,'Bronze',  'King',      'Leisure');
INSERT INTO Membership VALUES (92024,91024,'Silver',  'Accessible','Travel');
INSERT INTO Membership VALUES (92025,91025,'Gold',    'King',      'Business');
INSERT INTO Membership VALUES (92026,91026,'Bronze',  'Queen',     'Nearby Attractions');
INSERT INTO Membership VALUES (92027,91027,'Silver',  'Deluxe',    'Business');
INSERT INTO Membership VALUES (92028,91028,'Gold',    'Queen',     'Leisure');
INSERT INTO Membership VALUES (92029,91029,'Platinum','King',      'Business');
INSERT INTO Membership VALUES (92030,91030,'Bronze',  'Accessible','Travel');
INSERT INTO Membership VALUES (92031,91031,'Silver',  'King',      'Social Gathering');
INSERT INTO Membership VALUES (92032,91032,'Gold',    'Deluxe',    'Business');
INSERT INTO Membership VALUES (92033,91033,'Bronze',  'Queen',     'Leisure');
INSERT INTO Membership VALUES (92034,91034,'Silver',  'King',      'Nearby Attractions');
INSERT INTO Membership VALUES (92035,91035,'Gold',    'Deluxe',    'Business');
INSERT INTO Membership VALUES (92036,91036,'Platinum','Queen',     'Leisure');
INSERT INTO Membership VALUES (92037,91037,'Bronze',  'King',      'Travel');
INSERT INTO Membership VALUES (92038,91038,'Silver',  'Queen',     'Social Gathering');
INSERT INTO Membership VALUES (92039,91039,'Gold',    'Deluxe',    'Business');
INSERT INTO Membership VALUES (92040,91040,'Bronze',  'Accessible','Nearby Attractions');
INSERT INTO Membership VALUES (92041,91041,'Silver',  'King',      'Leisure');
INSERT INTO Membership VALUES (92042,91042,'Gold',    'Queen',     'Business');
INSERT INTO Membership VALUES (92043,91043,'Platinum','Deluxe',    'Travel');
INSERT INTO Membership VALUES (92044,91044,'Bronze',  'King',      'Social Gathering');
INSERT INTO Membership VALUES (92045,91045,'Silver',  'Accessible','Business');
INSERT INTO Membership VALUES (92046,91046,'Gold',    'Queen',     'Nearby Attractions');
INSERT INTO Membership VALUES (92047,91047,'Bronze',  'King',      'Leisure');
INSERT INTO Membership VALUES (92048,91048,'Silver',  'Deluxe',    'Business');
INSERT INTO Membership VALUES (92049,91049,'Gold',    'King',      'Travel');
INSERT INTO Membership VALUES (92050,91050,'Platinum','Queen',     'Social Gathering');

-- ============================================================
-- PaymentInfo  (50 rows | PaymentID: 93001-93050)
-- ============================================================
INSERT INTO PaymentInfo VALUES (93001,91001,'Visa',        '4521','123 Main St, Dallas TX');
INSERT INTO PaymentInfo VALUES (93002,91002,'MasterCard',  '3892','456 Oak Ave, Irving TX');
INSERT INTO PaymentInfo VALUES (93003,91003,'Visa',        '7714','789 Elm Dr, Plano TX');
INSERT INTO PaymentInfo VALUES (93004,91004,'Cash',        NULL,  '321 Pine Rd, Arlington TX');
INSERT INTO PaymentInfo VALUES (93005,91005,'Visa',        '9087','654 Maple St, Frisco TX');
INSERT INTO PaymentInfo VALUES (93006,91006,'Amex',        '1234','987 Cedar Blvd, Allen TX');
INSERT INTO PaymentInfo VALUES (93007,91007,'Visa',        '5566','147 Birch Ln, McKinney TX');
INSERT INTO PaymentInfo VALUES (93008,91008,'MasterCard',  '8893','258 Walnut Ave, Garland TX');
INSERT INTO PaymentInfo VALUES (93009,91009,'Visa',        '2244','369 Spruce Ct, Mesquite TX');
INSERT INTO PaymentInfo VALUES (93010,91010,'Bank Transfer',NULL, '741 Hickory Way, Carrollton TX');
INSERT INTO PaymentInfo VALUES (93011,91011,'Visa',        '6677','852 Willow Dr, Lewisville TX');
INSERT INTO PaymentInfo VALUES (93012,91012,'MasterCard',  '4411','963 Poplar Blvd, Denton TX');
INSERT INTO PaymentInfo VALUES (93013,91013,'Visa',        '3355','174 Magnolia St, Fort Worth TX');
INSERT INTO PaymentInfo VALUES (93014,91014,'Amex',        '9900','285 Cypress Rd, Mansfield TX');
INSERT INTO PaymentInfo VALUES (93015,91015,'Visa',        '7823','396 Dogwood Ln, Bedford TX');
INSERT INTO PaymentInfo VALUES (93016,91016,'Cash',        NULL,  '507 Redwood Ave, Euless TX');
INSERT INTO PaymentInfo VALUES (93017,91017,'Visa',        '1199','618 Oakwood Ct, Hurst TX');
INSERT INTO PaymentInfo VALUES (93018,91018,'MasterCard',  '4488','729 Peachtree Blvd, Keller TX');
INSERT INTO PaymentInfo VALUES (93019,91019,'Visa',        '5572','840 Sycamore Dr, Southlake TX');
INSERT INTO PaymentInfo VALUES (93020,91020,'Amex',        '6633','951 Aspen Way, Grapevine TX');
INSERT INTO PaymentInfo VALUES (93021,91021,'Visa',        '7744','162 Linden St, Colleyville TX');
INSERT INTO PaymentInfo VALUES (93022,91022,'Bank Transfer',NULL, '273 Juniper Ave, Flower Mound TX');
INSERT INTO PaymentInfo VALUES (93023,91023,'Visa',        '8855','384 Hawthorn Blvd, Coppell TX');
INSERT INTO PaymentInfo VALUES (93024,91024,'MasterCard',  '9966','495 Mulberry Rd, Irving TX');
INSERT INTO PaymentInfo VALUES (93025,91025,'Visa',        '1077','506 Laurel Ln, Dallas TX');
INSERT INTO PaymentInfo VALUES (93026,91026,'Cash',        NULL,  '617 Chestnut Dr, Plano TX');
INSERT INTO PaymentInfo VALUES (93027,91027,'Visa',        '2288','728 Bamboo Ct, Frisco TX');
INSERT INTO PaymentInfo VALUES (93028,91028,'Amex',        '3399','839 Palm Ave, McKinney TX');
INSERT INTO PaymentInfo VALUES (93029,91029,'Visa',        '4400','940 Olive Blvd, Allen TX');
INSERT INTO PaymentInfo VALUES (93030,91030,'MasterCard',  '5511','051 Fern Rd, Arlington TX');
INSERT INTO PaymentInfo VALUES (93031,91031,'Visa',        '6622','162 Cactus Ln, Grand Prairie TX');
INSERT INTO PaymentInfo VALUES (93032,91032,'Bank Transfer',NULL, '273 Sage Way, Duncanville TX');
INSERT INTO PaymentInfo VALUES (93033,91033,'Visa',        '7733','384 Moss Dr, Cedar Hill TX');
INSERT INTO PaymentInfo VALUES (93034,91034,'Amex',        '8844','495 Ivy Ave, DeSoto TX');
INSERT INTO PaymentInfo VALUES (93035,91035,'Visa',        '9955','506 Ficus Ct, Lancaster TX');
INSERT INTO PaymentInfo VALUES (93036,91036,'MasterCard',  '1066','617 Banyan Blvd, Rowlett TX');
INSERT INTO PaymentInfo VALUES (93037,91037,'Visa',        '2177','728 Sequoia St, Sachse TX');
INSERT INTO PaymentInfo VALUES (93038,91038,'Cash',        NULL,  '839 Redwood Dr, Wylie TX');
INSERT INTO PaymentInfo VALUES (93039,91039,'Visa',        '3288','940 Acacia Ave, Murphy TX');
INSERT INTO PaymentInfo VALUES (93040,91040,'Amex',        '4399','051 Mimosa Rd, Rockwall TX');
INSERT INTO PaymentInfo VALUES (93041,91041,'Visa',        '5400','162 Pecan Ln, Forney TX');
INSERT INTO PaymentInfo VALUES (93042,91042,'MasterCard',  '6511','273 Walnut Way, Kaufman TX');
INSERT INTO PaymentInfo VALUES (93043,91043,'Visa',        '7622','384 Hickory Blvd, Ennis TX');
INSERT INTO PaymentInfo VALUES (93044,91044,'Bank Transfer',NULL, '495 Maple Dr, Waxahachie TX');
INSERT INTO PaymentInfo VALUES (93045,91045,'Visa',        '8733','506 Birch Ave, Corsicana TX');
INSERT INTO PaymentInfo VALUES (93046,91046,'Cash',        NULL,  '617 Oak Ct, Athens TX');
INSERT INTO PaymentInfo VALUES (93047,91047,'Visa',        '9844','728 Pine St, Palestine TX');
INSERT INTO PaymentInfo VALUES (93048,91048,'Amex',        '0955','839 Elm Blvd, Tyler TX');
INSERT INTO PaymentInfo VALUES (93049,91049,'Visa',        '1066','940 Cedar Rd, Longview TX');
INSERT INTO PaymentInfo VALUES (93050,91050,'MasterCard',  '2177','051 Spruce Ln, Marshall TX');

-- ============================================================
-- Employee  (45 rows | EmployeeID: 94001-94045)
-- ============================================================
INSERT INTO Employee VALUES (94001,'Alice',  'Turner',    '1985-04-10','987-65-4001',55000.00,'Front Desk',  160);
INSERT INTO Employee VALUES (94002,'Bob',    'Clark',     '1979-08-22','987-65-4002',48000.00,'Housekeeping',160);
INSERT INTO Employee VALUES (94003,'Carol',  'Evans',     '1990-02-14','987-65-4003',62000.00,'Manager',     170);
INSERT INTO Employee VALUES (94004,'David',  'Murphy',    '1983-06-30','987-65-4004',45000.00,'Concierge',   155);
INSERT INTO Employee VALUES (94005,'Emma',   'Foster',    '1995-11-05','987-65-4005',42000.00,'Room Service', 160);
INSERT INTO Employee VALUES (94006,'Frank',  'Grant',     '1976-01-18','987-65-4006',52000.00,'Security',    168);
INSERT INTO Employee VALUES (94007,'Grace',  'Hill',      '1988-09-27','987-65-4007',58000.00,'Spa Therapist',160);
INSERT INTO Employee VALUES (94008,'Henry',  'Irving',    '1992-03-12','987-65-4008',40000.00,'Shuttle Driver',160);
INSERT INTO Employee VALUES (94009,'Iris',   'James',     '1980-07-08','987-65-4009',47000.00,'Housekeeping',155);
INSERT INTO Employee VALUES (94010,'Jack',   'King',      '1986-12-23','987-65-4010',61000.00,'Front Desk',  165);
INSERT INTO Employee VALUES (94011,'Karen',  'Lane',      '1974-05-15','987-65-4011',70000.00,'Manager',     170);
INSERT INTO Employee VALUES (94012,'Leo',    'Morgan',    '1993-10-04','987-65-4012',44000.00,'Room Service', 160);
INSERT INTO Employee VALUES (94013,'Mary',   'Newton',    '1982-02-19','987-65-4013',56000.00,'Spa Therapist',160);
INSERT INTO Employee VALUES (94014,'Nick',   'Owen',      '1997-08-11','987-65-4014',38000.00,'Shuttle Driver',160);
INSERT INTO Employee VALUES (94015,'Olivia', 'Parker',    '1971-04-26','987-65-4015',53000.00,'Concierge',   158);
INSERT INTO Employee VALUES (94016,'Peter',  'Quinn',     '1989-09-09','987-65-4016',49000.00,'Security',    168);
INSERT INTO Employee VALUES (94017,'Quinn',  'Reed',      '1985-01-31','987-65-4017',46000.00,'Housekeeping',160);
INSERT INTO Employee VALUES (94018,'Rachel', 'Stone',     '1994-06-14','987-65-4018',43000.00,'Room Service', 155);
INSERT INTO Employee VALUES (94019,'Sam',    'Taylor',    '1978-11-28','987-65-4019',59000.00,'Front Desk',  162);
INSERT INTO Employee VALUES (94020,'Tina',   'Underwood', '1991-03-07','987-65-4020',41000.00,'Housekeeping',160);
INSERT INTO Employee VALUES (94021,'Uma',    'Vincent',   '1969-07-21','987-65-4021',75000.00,'Manager',     172);
INSERT INTO Employee VALUES (94022,'Victor', 'Walsh',     '1987-12-16','987-65-4022',57000.00,'Spa Therapist',160);
INSERT INTO Employee VALUES (94023,'Wendy',  'Xavier',    '1996-04-03','987-65-4023',39000.00,'Shuttle Driver',160);
INSERT INTO Employee VALUES (94024,'Xander', 'Young',     '1981-08-18','987-65-4024',54000.00,'Concierge',   157);
INSERT INTO Employee VALUES (94025,'Yolanda','Zimmer',    '1975-02-25','987-65-4025',50000.00,'Security',    168);
INSERT INTO Employee VALUES (94026,'Zach',   'Adams',     '1990-10-10','987-65-4026',44000.00,'Room Service', 160);
INSERT INTO Employee VALUES (94027,'Amy',    'Baker',     '1984-05-05','987-65-4027',48000.00,'Front Desk',  163);
INSERT INTO Employee VALUES (94028,'Ben',    'Carter',    '1977-09-14','987-65-4028',62000.00,'Spa Therapist',160);
INSERT INTO Employee VALUES (94029,'Clara',  'Davis',     '1993-01-22','987-65-4029',37000.00,'Shuttle Driver',160);
INSERT INTO Employee VALUES (94030,'Derek',  'Edwards',   '1986-06-08','987-65-4030',51000.00,'Housekeeping',158);
INSERT INTO Employee VALUES (94031,'Eva',    'Frank',     '1970-11-17','987-65-4031',66000.00,'Manager',     170);
INSERT INTO Employee VALUES (94032,'Fred',   'Garcia',    '1988-03-29','987-65-4032',46000.00,'Security',    168);
INSERT INTO Employee VALUES (94033,'Gina',   'Hughes',    '1995-08-06','987-65-4033',42000.00,'Room Service', 155);
INSERT INTO Employee VALUES (94034,'Hank',   'Ingram',    '1980-12-20','987-65-4034',55000.00,'Concierge',   160);
INSERT INTO Employee VALUES (94035,'Ida',    'Jensen',    '1992-04-15','987-65-4035',40000.00,'Housekeeping',160);
INSERT INTO Employee VALUES (94036,'Jake',   'Kim',       '1973-09-01','987-65-4036',58000.00,'Front Desk',  165);
INSERT INTO Employee VALUES (94037,'Lily',   'Lee',       '1989-02-11','987-65-4037',44000.00,'Shuttle Driver',160);
INSERT INTO Employee VALUES (94038,'Mike',   'Moon',      '1983-07-27','987-65-4038',60000.00,'Spa Therapist',160);
INSERT INTO Employee VALUES (94039,'Nina',   'Nash',      '1997-01-09','987-65-4039',38000.00,'Room Service', 155);
INSERT INTO Employee VALUES (94040,'Omar',   'Park',      '1976-05-23','987-65-4040',53000.00,'Security',    168);
INSERT INTO Employee VALUES (94041,'Paula',  'Quinn',     '1984-10-17','987-65-4041',47000.00,'Housekeeping',160);
INSERT INTO Employee VALUES (94042,'Ray',    'Ross',      '1991-07-04','987-65-4042',43000.00,'Room Service', 158);
INSERT INTO Employee VALUES (94043,'Sara',   'Simmons',   '1968-03-19','987-65-4043',72000.00,'Manager',     172);
INSERT INTO Employee VALUES (94044,'Ted',    'Thomas',    '1986-12-01','987-65-4044',49000.00,'Front Desk',  162);
INSERT INTO Employee VALUES (94045,'Una',    'Upton',     '1994-08-22','987-65-4045',36000.00,'Shuttle Driver',160);

-- ============================================================
-- Reservation  (50 rows | ReservationID: 95001-95050)
-- Rooms 90106 and 90408 are Blocked — not used here.
-- ============================================================
INSERT INTO Reservation VALUES (95001,91001,90101,'2025-09-01','14:00','2025-09-05', 1000.00,'Completed','Late checkout',    'Credit Card');
INSERT INTO Reservation VALUES (95002,91002,90102,'2025-09-03','15:00','2025-09-06',  540.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95003,91003,90103,'2025-09-05','12:00','2025-09-10', 1600.00,'Completed','Extra pillows',    'Credit Card');
INSERT INTO Reservation VALUES (95004,91004,90104,'2025-09-07','16:00','2025-09-09',  300.00,'Completed',NULL,               'Cash');
INSERT INTO Reservation VALUES (95005,91005,90105,'2025-09-10','14:00','2025-09-14', 1040.00,'Completed','Non-smoking floor', 'Credit Card');
INSERT INTO Reservation VALUES (95006,91006,90107,'2025-09-12','15:00','2025-09-15',  990.00,'Completed',NULL,               'Amex');
INSERT INTO Reservation VALUES (95007,91007,90108,'2025-09-14','13:00','2025-09-17',  765.00,'Completed','Quiet room',       'Credit Card');
INSERT INTO Reservation VALUES (95008,91008,90109,'2025-09-16','15:00','2025-09-20',  740.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95009,91009,90201,'2025-09-18','11:00','2025-09-21',  810.00,'Completed','High floor',       'Credit Card');
INSERT INTO Reservation VALUES (95010,91010,90202,'2025-09-20','15:00','2025-09-23',  585.00,'Completed',NULL,               'Bank Transfer');
INSERT INTO Reservation VALUES (95011,91011,90203,'2025-09-22','14:00','2025-09-27', 1700.00,'Completed','Extra towels',     'Credit Card');
INSERT INTO Reservation VALUES (95012,91012,90204,'2025-09-24','15:00','2025-09-27',  795.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95013,91013,90205,'2025-09-26','12:00','2025-09-30',  800.00,'Completed','Feather-free room', 'Credit Card');
INSERT INTO Reservation VALUES (95014,91014,90207,'2025-09-28','15:00','2025-10-02', 1400.00,'Completed',NULL,               'Amex');
INSERT INTO Reservation VALUES (95015,91015,90208,'2025-10-01','13:00','2025-10-05', 1100.00,'Completed','Airport shuttle',  'Credit Card');
INSERT INTO Reservation VALUES (95016,91016,90209,'2025-10-03','15:00','2025-10-06',  570.00,'Completed',NULL,               'Cash');
INSERT INTO Reservation VALUES (95017,91017,90301,'2025-10-05','14:00','2025-10-09', 1120.00,'Completed','Baby crib needed', 'Credit Card');
INSERT INTO Reservation VALUES (95018,91018,90302,'2025-10-07','15:00','2025-10-10',  615.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95019,91019,90303,'2025-10-09','11:00','2025-10-14', 1800.00,'Completed','Champagne welcome', 'Credit Card');
INSERT INTO Reservation VALUES (95020,91020,90304,'2025-10-11','15:00','2025-10-14',  855.00,'Completed',NULL,               'Amex');
INSERT INTO Reservation VALUES (95021,91021,90305,'2025-10-13','14:00','2025-10-17',  840.00,'Completed','Honeymoon setup',  'Credit Card');
INSERT INTO Reservation VALUES (95022,91022,90307,'2025-10-15','15:00','2025-10-19', 1480.00,'Completed',NULL,               'Bank Transfer');
INSERT INTO Reservation VALUES (95023,91023,90308,'2025-10-17','12:00','2025-10-21', 1160.00,'Completed','Extra hangers',    'Credit Card');
INSERT INTO Reservation VALUES (95024,91024,90309,'2025-10-19','15:00','2025-10-22',  645.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95025,91025,90401,'2025-10-21','13:00','2025-10-25', 1200.00,'Completed','Late checkout',    'Credit Card');
INSERT INTO Reservation VALUES (95026,91026,90402,'2025-10-23','15:00','2025-10-26',  660.00,'Completed',NULL,               'Cash');
INSERT INTO Reservation VALUES (95027,91027,90403,'2025-10-25','14:00','2025-10-30', 1900.00,'Completed','Dietary needs',    'Credit Card');
INSERT INTO Reservation VALUES (95028,91028,90404,'2025-10-27','15:00','2025-10-31', 1240.00,'Completed',NULL,               'Amex');
INSERT INTO Reservation VALUES (95029,91029,90405,'2025-10-29','11:00','2025-11-02',  900.00,'Completed','Early check-in',   'Credit Card');
INSERT INTO Reservation VALUES (95030,91030,90406,'2025-11-01','15:00','2025-11-04',  540.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95031,91031,90407,'2025-11-03','14:00','2025-11-07', 1560.00,'Completed','Corner room',      'Credit Card');
INSERT INTO Reservation VALUES (95032,91032,90409,'2025-11-05','15:00','2025-11-08',  690.00,'Completed',NULL,               'Bank Transfer');
INSERT INTO Reservation VALUES (95033,91033,90501,'2025-11-07','12:00','2025-11-11', 1280.00,'Completed','Gym access',       'Credit Card');
INSERT INTO Reservation VALUES (95034,91034,90502,'2025-11-09','15:00','2025-11-12',  705.00,'Completed',NULL,               'Cash');
INSERT INTO Reservation VALUES (95035,91035,90503,'2025-11-11','13:00','2025-11-16', 2000.00,'Completed','Butler service',   'Credit Card');
INSERT INTO Reservation VALUES (95036,91036,90504,'2025-11-13','15:00','2025-11-17', 1300.00,'Completed',NULL,               'Amex');
INSERT INTO Reservation VALUES (95037,91037,90505,'2025-11-15','14:00','2025-11-19',  960.00,'Completed','Sea-facing room',  'Credit Card');
INSERT INTO Reservation VALUES (95038,91038,90506,'2025-11-17','15:00','2025-11-20',  570.00,'Completed',NULL,               'Debit Card');
INSERT INTO Reservation VALUES (95039,91039,90507,'2025-11-19','11:00','2025-11-23', 1640.00,'Completed','Extra bed needed', 'Credit Card');
INSERT INTO Reservation VALUES (95040,91040,90508,'2025-11-21','15:00','2025-11-25', 1320.00,'Completed',NULL,               'Amex');
-- Repeat-guest reservations for loyalty/business queries
INSERT INTO Reservation VALUES (95041,91001,90201,'2025-12-01','14:00','2025-12-05', 1080.00,'Completed','High floor',       'Credit Card');
INSERT INTO Reservation VALUES (95042,91001,90301,'2026-01-10','14:00','2026-01-14', 1120.00,'Completed',NULL,               'Credit Card');
INSERT INTO Reservation VALUES (95043,91001,90401,'2026-02-15','14:00','2026-02-19', 1200.00,'Completed','Anniversary',      'Credit Card');
INSERT INTO Reservation VALUES (95044,91003,90207,'2026-01-05','12:00','2026-01-09', 1320.00,'Completed','Board meeting',    'Credit Card');
INSERT INTO Reservation VALUES (95045,91005,90307,'2026-01-20','14:00','2026-01-24', 1480.00,'Completed',NULL,               'Credit Card');
INSERT INTO Reservation VALUES (95046,91009,90501,'2026-02-01','11:00','2026-02-05', 1280.00,'Confirmed','Early check-in',   'Credit Card');
INSERT INTO Reservation VALUES (95047,91011,90402,'2026-02-10','14:00','2026-02-14',  880.00,'Confirmed',NULL,               'Credit Card');
INSERT INTO Reservation VALUES (95048,91015,90502,'2026-02-20','13:00','2026-02-24',  940.00,'Pending',  'Shuttle needed',   'Credit Card');
INSERT INTO Reservation VALUES (95049,91022,90303,'2026-03-01','15:00','2026-03-05', 1440.00,'Pending',   NULL,              'Bank Transfer');
INSERT INTO Reservation VALUES (95050,91029,90407,'2026-03-10','11:00','2026-03-14', 1560.00,'Pending',  'Adjoining rooms',  'Credit Card');

-- ============================================================
-- ReservationGuest  (65 rows)
-- ============================================================
INSERT INTO ReservationGuest VALUES (95001,91001);
INSERT INTO ReservationGuest VALUES (95002,91002);
INSERT INTO ReservationGuest VALUES (95003,91003);
INSERT INTO ReservationGuest VALUES (95004,91004);
INSERT INTO ReservationGuest VALUES (95005,91005);
INSERT INTO ReservationGuest VALUES (95006,91006);
INSERT INTO ReservationGuest VALUES (95007,91007);
INSERT INTO ReservationGuest VALUES (95008,91008);
INSERT INTO ReservationGuest VALUES (95009,91009);
INSERT INTO ReservationGuest VALUES (95010,91010);
INSERT INTO ReservationGuest VALUES (95011,91011);
INSERT INTO ReservationGuest VALUES (95012,91012);
INSERT INTO ReservationGuest VALUES (95013,91013);
INSERT INTO ReservationGuest VALUES (95014,91014);
INSERT INTO ReservationGuest VALUES (95015,91015);
INSERT INTO ReservationGuest VALUES (95016,91016);
INSERT INTO ReservationGuest VALUES (95017,91017);
INSERT INTO ReservationGuest VALUES (95018,91018);
INSERT INTO ReservationGuest VALUES (95019,91019);
INSERT INTO ReservationGuest VALUES (95020,91020);
INSERT INTO ReservationGuest VALUES (95021,91021);
INSERT INTO ReservationGuest VALUES (95022,91022);
INSERT INTO ReservationGuest VALUES (95023,91023);
INSERT INTO ReservationGuest VALUES (95024,91024);
INSERT INTO ReservationGuest VALUES (95025,91025);
INSERT INTO ReservationGuest VALUES (95026,91026);
INSERT INTO ReservationGuest VALUES (95027,91027);
INSERT INTO ReservationGuest VALUES (95028,91028);
INSERT INTO ReservationGuest VALUES (95029,91029);
INSERT INTO ReservationGuest VALUES (95030,91030);
INSERT INTO ReservationGuest VALUES (95031,91031);
INSERT INTO ReservationGuest VALUES (95032,91032);
INSERT INTO ReservationGuest VALUES (95033,91033);
INSERT INTO ReservationGuest VALUES (95034,91034);
INSERT INTO ReservationGuest VALUES (95035,91035);
INSERT INTO ReservationGuest VALUES (95036,91036);
INSERT INTO ReservationGuest VALUES (95037,91037);
INSERT INTO ReservationGuest VALUES (95038,91038);
INSERT INTO ReservationGuest VALUES (95039,91039);
INSERT INTO ReservationGuest VALUES (95040,91040);
INSERT INTO ReservationGuest VALUES (95041,91001);
INSERT INTO ReservationGuest VALUES (95042,91001);
INSERT INTO ReservationGuest VALUES (95043,91001);
INSERT INTO ReservationGuest VALUES (95044,91003);
INSERT INTO ReservationGuest VALUES (95045,91005);
INSERT INTO ReservationGuest VALUES (95046,91009);
INSERT INTO ReservationGuest VALUES (95047,91011);
INSERT INTO ReservationGuest VALUES (95048,91015);
INSERT INTO ReservationGuest VALUES (95049,91022);
INSERT INTO ReservationGuest VALUES (95050,91029);
-- Additional guests on shared reservations
INSERT INTO ReservationGuest VALUES (95003,91004);
INSERT INTO ReservationGuest VALUES (95003,91005);
INSERT INTO ReservationGuest VALUES (95009,91010);
INSERT INTO ReservationGuest VALUES (95011,91012);
INSERT INTO ReservationGuest VALUES (95019,91020);
INSERT INTO ReservationGuest VALUES (95019,91021);
INSERT INTO ReservationGuest VALUES (95027,91028);
INSERT INTO ReservationGuest VALUES (95031,91032);
INSERT INTO ReservationGuest VALUES (95035,91036);
INSERT INTO ReservationGuest VALUES (95035,91037);
INSERT INTO ReservationGuest VALUES (95039,91040);
INSERT INTO ReservationGuest VALUES (95039,91041);
INSERT INTO ReservationGuest VALUES (95043,91002);
INSERT INTO ReservationGuest VALUES (95044,91004);
INSERT INTO ReservationGuest VALUES (95046,91010);

-- ============================================================
-- Service  (120 rows | ServiceID: 96001-96120)
-- 40 Room Service (96001-96040), 40 Spa (96041-96080), 40 Shuttle (96081-96120)
-- ============================================================
INSERT INTO Service VALUES (96001,95001,'Room Service','2025-09-01 19:30:00','Completed', 45.00,94005);
INSERT INTO Service VALUES (96002,95002,'Room Service','2025-09-03 20:00:00','Completed', 52.00,94012);
INSERT INTO Service VALUES (96003,95003,'Room Service','2025-09-07 21:00:00','Completed', 38.00,94018);
INSERT INTO Service VALUES (96004,95004,'Room Service','2025-09-08 19:30:00','Completed', 30.00,94026);
INSERT INTO Service VALUES (96005,95005,'Room Service','2025-09-10 20:00:00','Completed', 65.00,94033);
INSERT INTO Service VALUES (96006,95006,'Room Service','2025-09-12 21:30:00','Completed', 42.00,94039);
INSERT INTO Service VALUES (96007,95007,'Room Service','2025-09-14 19:00:00','Completed', 55.00,94042);
INSERT INTO Service VALUES (96008,95008,'Room Service','2025-09-16 20:30:00','Completed', 48.00,94005);
INSERT INTO Service VALUES (96009,95009,'Room Service','2025-09-18 21:00:00','Completed', 78.00,94012);
INSERT INTO Service VALUES (96010,95010,'Room Service','2025-09-20 19:00:00','Completed', 55.00,94018);
INSERT INTO Service VALUES (96011,95011,'Room Service','2025-09-22 20:00:00','Completed', 60.00,94026);
INSERT INTO Service VALUES (96012,95012,'Room Service','2025-09-24 21:00:00','Completed', 48.00,94033);
INSERT INTO Service VALUES (96013,95013,'Room Service','2025-09-26 19:30:00','Completed', 50.00,94039);
INSERT INTO Service VALUES (96014,95014,'Room Service','2025-09-29 22:00:00','Completed', 60.00,94042);
INSERT INTO Service VALUES (96015,95015,'Room Service','2025-10-02 20:00:00','Completed', 70.00,94005);
INSERT INTO Service VALUES (96016,95016,'Room Service','2025-10-04 19:30:00','Completed', 35.00,94012);
INSERT INTO Service VALUES (96017,95017,'Room Service','2025-10-06 21:00:00','Completed', 55.00,94018);
INSERT INTO Service VALUES (96018,95018,'Room Service','2025-10-07 20:00:00','Completed', 50.00,94026);
INSERT INTO Service VALUES (96019,95019,'Room Service','2025-10-10 22:00:00','Completed', 80.00,94033);
INSERT INTO Service VALUES (96020,95020,'Room Service','2025-10-11 21:00:00','Completed', 55.00,94039);
INSERT INTO Service VALUES (96021,95021,'Room Service','2025-10-14 20:00:00','Completed', 45.00,94042);
INSERT INTO Service VALUES (96022,95022,'Room Service','2025-10-16 19:30:00','Completed', 60.00,94005);
INSERT INTO Service VALUES (96023,95023,'Room Service','2025-10-17 21:00:00','Completed', 45.00,94012);
INSERT INTO Service VALUES (96024,95024,'Room Service','2025-10-20 20:00:00','Completed', 38.00,94018);
INSERT INTO Service VALUES (96025,95025,'Room Service','2025-10-22 22:00:00','Completed', 72.00,94026);
INSERT INTO Service VALUES (96026,95026,'Room Service','2025-10-23 21:00:00','Completed', 38.00,94033);
INSERT INTO Service VALUES (96027,95027,'Room Service','2025-10-26 20:00:00','Completed', 85.00,94039);
INSERT INTO Service VALUES (96028,95028,'Room Service','2025-10-28 21:30:00','Completed', 62.00,94042);
INSERT INTO Service VALUES (96029,95029,'Room Service','2025-10-30 20:00:00','Completed', 70.00,94005);
INSERT INTO Service VALUES (96030,95030,'Room Service','2025-11-02 21:00:00','Completed', 42.00,94012);
INSERT INTO Service VALUES (96031,95031,'Room Service','2025-11-04 20:00:00','Completed', 68.00,94018);
INSERT INTO Service VALUES (96032,95032,'Room Service','2025-11-06 19:30:00','Completed', 42.00,94026);
INSERT INTO Service VALUES (96033,95033,'Room Service','2025-11-08 21:00:00','Completed', 55.00,94033);
INSERT INTO Service VALUES (96034,95034,'Room Service','2025-11-10 20:00:00','Completed', 48.00,94039);
INSERT INTO Service VALUES (96035,95035,'Room Service','2025-11-12 22:00:00','Completed', 90.00,94042);
INSERT INTO Service VALUES (96036,95036,'Room Service','2025-11-14 20:00:00','Completed', 65.00,94005);
INSERT INTO Service VALUES (96037,95037,'Room Service','2025-11-16 21:00:00','Completed', 60.00,94012);
INSERT INTO Service VALUES (96038,95038,'Room Service','2025-11-18 19:30:00','Completed', 35.00,94018);
INSERT INTO Service VALUES (96039,95039,'Room Service','2025-11-20 21:00:00','Completed', 75.00,94026);
INSERT INTO Service VALUES (96040,95040,'Room Service','2025-11-22 20:00:00','Completed', 55.00,94033);
-- Spa services
INSERT INTO Service VALUES (96041,95001,'Spa','2025-09-02 10:00:00','Completed', 80.00,94007);
INSERT INTO Service VALUES (96042,95003,'Spa','2025-09-06 09:00:00','Completed',120.00,94013);
INSERT INTO Service VALUES (96043,95005,'Spa','2025-09-11 11:00:00','Completed', 95.00,94022);
INSERT INTO Service VALUES (96044,95007,'Spa','2025-09-15 10:00:00','Completed',110.00,94028);
INSERT INTO Service VALUES (96045,95008,'Spa','2025-09-17 10:00:00','Completed',110.00,94038);
INSERT INTO Service VALUES (96046,95009,'Spa','2025-09-19 11:00:00','Completed',100.00,94007);
INSERT INTO Service VALUES (96047,95011,'Spa','2025-09-23 09:00:00','Completed',150.00,94013);
INSERT INTO Service VALUES (96048,95013,'Spa','2025-09-27 11:00:00','Completed',125.00,94022);
INSERT INTO Service VALUES (96049,95014,'Spa','2025-09-29 10:00:00','Completed',130.00,94028);
INSERT INTO Service VALUES (96050,95015,'Spa','2025-10-03 11:00:00','Completed',140.00,94038);
INSERT INTO Service VALUES (96051,95017,'Spa','2025-10-06 10:00:00','Completed',100.00,94007);
INSERT INTO Service VALUES (96052,95019,'Spa','2025-10-10 11:00:00','Completed',140.00,94013);
INSERT INTO Service VALUES (96053,95020,'Spa','2025-10-12 10:00:00','Completed', 90.00,94022);
INSERT INTO Service VALUES (96054,95021,'Spa','2025-10-14 11:00:00','Completed',120.00,94028);
INSERT INTO Service VALUES (96055,95022,'Spa','2025-10-16 10:00:00','Completed',160.00,94038);
INSERT INTO Service VALUES (96056,95023,'Spa','2025-10-18 11:00:00','Completed', 85.00,94007);
INSERT INTO Service VALUES (96057,95025,'Spa','2025-10-22 11:00:00','Completed',120.00,94013);
INSERT INTO Service VALUES (96058,95027,'Spa','2025-10-26 10:00:00','Completed',180.00,94022);
INSERT INTO Service VALUES (96059,95028,'Spa','2025-10-28 11:00:00','Completed',145.00,94028);
INSERT INTO Service VALUES (96060,95029,'Spa','2025-10-31 10:00:00','Completed',130.00,94038);
INSERT INTO Service VALUES (96061,95031,'Spa','2025-11-04 11:00:00','Completed',155.00,94007);
INSERT INTO Service VALUES (96062,95033,'Spa','2025-11-08 10:00:00','Completed',115.00,94013);
INSERT INTO Service VALUES (96063,95035,'Spa','2025-11-12 11:00:00','Completed',200.00,94022);
INSERT INTO Service VALUES (96064,95036,'Spa','2025-11-14 10:00:00','Completed',130.00,94028);
INSERT INTO Service VALUES (96065,95037,'Spa','2025-11-16 11:00:00','Completed', 95.00,94038);
INSERT INTO Service VALUES (96066,95038,'Spa','2025-11-18 10:00:00','Completed', 90.00,94007);
INSERT INTO Service VALUES (96067,95039,'Spa','2025-11-20 11:00:00','Completed',160.00,94013);
INSERT INTO Service VALUES (96068,95040,'Spa','2025-11-22 10:00:00','Completed',140.00,94022);
INSERT INTO Service VALUES (96069,95041,'Spa','2025-12-02 11:00:00','Completed',120.00,94028);
INSERT INTO Service VALUES (96070,95042,'Spa','2026-01-11 10:00:00','Completed',110.00,94038);
INSERT INTO Service VALUES (96071,95043,'Spa','2026-02-16 11:00:00','Completed',130.00,94007);
INSERT INTO Service VALUES (96072,95044,'Spa','2026-01-06 10:00:00','Completed',150.00,94013);
INSERT INTO Service VALUES (96073,95045,'Spa','2026-01-21 11:00:00','Completed',140.00,94022);
INSERT INTO Service VALUES (96074,95046,'Spa','2026-02-02 10:00:00','Completed',120.00,94028);
INSERT INTO Service VALUES (96075,95047,'Spa','2026-02-11 11:00:00','Completed',100.00,94038);
INSERT INTO Service VALUES (96076,95024,'Spa','2025-10-20 10:00:00','Completed', 95.00,94007);
INSERT INTO Service VALUES (96077,95026,'Spa','2025-10-24 11:00:00','Completed', 80.00,94013);
INSERT INTO Service VALUES (96078,95032,'Spa','2025-11-06 10:00:00','Completed', 90.00,94022);
INSERT INTO Service VALUES (96079,95034,'Spa','2025-11-10 11:00:00','Completed', 85.00,94028);
INSERT INTO Service VALUES (96080,95048,'Spa','2026-02-21 10:00:00','Completed',110.00,94038);
-- Shuttle services
INSERT INTO Service VALUES (96081,95001,'Shuttle','2025-09-05 11:00:00','Completed', 35.00,94008);
INSERT INTO Service VALUES (96082,95004,'Shuttle','2025-09-09 08:00:00','Completed', 35.00,94014);
INSERT INTO Service VALUES (96083,95006,'Shuttle','2025-09-15 09:00:00','Completed', 35.00,94023);
INSERT INTO Service VALUES (96084,95007,'Shuttle','2025-09-17 09:30:00','Completed', 35.00,94029);
INSERT INTO Service VALUES (96085,95010,'Shuttle','2025-09-23 07:30:00','Completed', 35.00,94037);
INSERT INTO Service VALUES (96086,95011,'Shuttle','2025-09-27 10:00:00','Completed', 35.00,94045);
INSERT INTO Service VALUES (96087,95012,'Shuttle','2025-09-27 08:00:00','Completed', 35.00,94008);
INSERT INTO Service VALUES (96088,95013,'Shuttle','2025-09-30 08:30:00','Completed', 35.00,94014);
INSERT INTO Service VALUES (96089,95015,'Shuttle','2025-10-05 07:00:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96090,95016,'Shuttle','2025-10-06 08:30:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96091,95018,'Shuttle','2025-10-10 07:00:00','Completed', 40.00,94037);
INSERT INTO Service VALUES (96092,95019,'Shuttle','2025-10-14 09:00:00','Completed', 40.00,94045);
INSERT INTO Service VALUES (96093,95021,'Shuttle','2025-10-17 08:00:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96094,95022,'Shuttle','2025-10-19 09:30:00','Completed', 40.00,94014);
INSERT INTO Service VALUES (96095,95023,'Shuttle','2025-10-21 07:30:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96096,95025,'Shuttle','2025-10-25 08:00:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96097,95026,'Shuttle','2025-10-26 09:00:00','Completed', 40.00,94037);
INSERT INTO Service VALUES (96098,95027,'Shuttle','2025-10-30 08:00:00','Completed', 40.00,94045);
INSERT INTO Service VALUES (96099,95028,'Shuttle','2025-10-31 07:30:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96100,95029,'Shuttle','2025-11-02 09:00:00','Completed', 40.00,94014);
INSERT INTO Service VALUES (96101,95030,'Shuttle','2025-11-04 09:00:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96102,95031,'Shuttle','2025-11-07 08:30:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96103,95032,'Shuttle','2025-11-08 07:00:00','Completed', 40.00,94037);
INSERT INTO Service VALUES (96104,95033,'Shuttle','2025-11-11 07:00:00','Completed', 40.00,94045);
INSERT INTO Service VALUES (96105,95034,'Shuttle','2025-11-12 08:30:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96106,95035,'Shuttle','2025-11-16 09:00:00','Completed', 40.00,94014);
INSERT INTO Service VALUES (96107,95036,'Shuttle','2025-11-17 08:30:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96108,95037,'Shuttle','2025-11-19 07:30:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96109,95038,'Shuttle','2025-11-20 09:00:00','Completed', 40.00,94037);
INSERT INTO Service VALUES (96110,95039,'Shuttle','2025-11-23 07:30:00','Completed', 40.00,94045);
INSERT INTO Service VALUES (96111,95040,'Shuttle','2025-11-25 08:00:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96112,95041,'Shuttle','2025-12-05 09:00:00','Completed', 40.00,94014);
INSERT INTO Service VALUES (96113,95042,'Shuttle','2026-01-14 08:30:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96114,95043,'Shuttle','2026-02-19 09:00:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96115,95044,'Shuttle','2026-01-09 07:30:00','Completed', 40.00,94037);
INSERT INTO Service VALUES (96116,95045,'Shuttle','2026-01-24 08:00:00','Completed', 40.00,94045);
INSERT INTO Service VALUES (96117,95046,'Shuttle','2026-02-05 09:30:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96118,95047,'Shuttle','2026-02-14 08:00:00','Completed', 40.00,94014);
INSERT INTO Service VALUES (96119,95049,'Shuttle','2026-03-05 07:30:00','Completed', 40.00,94023);
INSERT INTO Service VALUES (96120,95050,'Shuttle','2026-03-14 09:00:00','Completed', 40.00,94029);

-- ============================================================
-- RoomService  (40 rows)
-- ============================================================
INSERT INTO RoomService VALUES (96001,90101,'Dinner for two - steak and pasta');
INSERT INTO RoomService VALUES (96002,90102,'Breakfast - continental');
INSERT INTO RoomService VALUES (96003,90103,'Late night snacks and wine');
INSERT INTO RoomService VALUES (96004,90104,'Light lunch - soup and sandwich');
INSERT INTO RoomService VALUES (96005,90105,'Dinner - burgers and fries');
INSERT INTO RoomService VALUES (96006,90107,'Light lunch - sandwiches');
INSERT INTO RoomService VALUES (96007,90108,'Breakfast - eggs benedict');
INSERT INTO RoomService VALUES (96008,90109,'Snack platter - cheese board');
INSERT INTO RoomService VALUES (96009,90201,'Full dinner service - 4 courses');
INSERT INTO RoomService VALUES (96010,90202,'Breakfast - eggs and toast');
INSERT INTO RoomService VALUES (96011,90203,'Dinner - pasta and salad');
INSERT INTO RoomService VALUES (96012,90204,'Late night - snack platter');
INSERT INTO RoomService VALUES (96013,90205,'Breakfast - pancakes and syrup');
INSERT INTO RoomService VALUES (96014,90207,'Late night - pizza and soda');
INSERT INTO RoomService VALUES (96015,90208,'Dinner - seafood special');
INSERT INTO RoomService VALUES (96016,90209,'Lunch - club sandwich');
INSERT INTO RoomService VALUES (96017,90301,'Dinner - chicken and veggies');
INSERT INTO RoomService VALUES (96018,90302,'Breakfast - pancakes');
INSERT INTO RoomService VALUES (96019,90303,'Full dinner for three');
INSERT INTO RoomService VALUES (96020,90304,'Dinner - seafood platter');
INSERT INTO RoomService VALUES (96021,90305,'Honeymoon breakfast setup');
INSERT INTO RoomService VALUES (96022,90307,'Late night platter - fruits');
INSERT INTO RoomService VALUES (96023,90308,'Late night snacks');
INSERT INTO RoomService VALUES (96024,90309,'Breakfast - yogurt and granola');
INSERT INTO RoomService VALUES (96025,90401,'Full dinner - 3 courses');
INSERT INTO RoomService VALUES (96026,90402,'Breakfast buffet order');
INSERT INTO RoomService VALUES (96027,90403,'Dinner - steak and wine');
INSERT INTO RoomService VALUES (96028,90404,'Lunch - salad bowl and juice');
INSERT INTO RoomService VALUES (96029,90405,'Dinner for two - seafood');
INSERT INTO RoomService VALUES (96030,90406,'Breakfast - toast and eggs');
INSERT INTO RoomService VALUES (96031,90407,'Corner room dinner service');
INSERT INTO RoomService VALUES (96032,90409,'Lunch - salad bowl');
INSERT INTO RoomService VALUES (96033,90501,'Gym-day breakfast');
INSERT INTO RoomService VALUES (96034,90502,'Dinner - pasta');
INSERT INTO RoomService VALUES (96035,90503,'Butler-arranged dinner');
INSERT INTO RoomService VALUES (96036,90504,'Breakfast - American');
INSERT INTO RoomService VALUES (96037,90505,'Snack platter - cheese and crackers');
INSERT INTO RoomService VALUES (96038,90506,'Breakfast - continental');
INSERT INTO RoomService VALUES (96039,90507,'Full dinner for two');
INSERT INTO RoomService VALUES (96040,90508,'Dinner - steak and vegetables');

-- ============================================================
-- SpaService  (40 rows)
-- ============================================================
INSERT INTO SpaService VALUES (96041,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96042,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96043,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96044,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96045,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96046,'Facial Treatment',     45);
INSERT INTO SpaService VALUES (96047,'Couples Massage',      90);
INSERT INTO SpaService VALUES (96048,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96049,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96050,'Full Body Wrap',      120);
INSERT INTO SpaService VALUES (96051,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96052,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96053,'Facial Treatment',     45);
INSERT INTO SpaService VALUES (96054,'Couples Massage',      90);
INSERT INTO SpaService VALUES (96055,'Full Body Wrap',      120);
INSERT INTO SpaService VALUES (96056,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96057,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96058,'Couples Massage',     120);
INSERT INTO SpaService VALUES (96059,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96060,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96061,'Full Body Wrap',      120);
INSERT INTO SpaService VALUES (96062,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96063,'Couples Massage',     120);
INSERT INTO SpaService VALUES (96064,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96065,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96066,'Facial Treatment',     45);
INSERT INTO SpaService VALUES (96067,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96068,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96069,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96070,'Couples Massage',      90);
INSERT INTO SpaService VALUES (96071,'Full Body Wrap',      120);
INSERT INTO SpaService VALUES (96072,'Deep Tissue Massage',  90);
INSERT INTO SpaService VALUES (96073,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96074,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96075,'Facial Treatment',     45);
INSERT INTO SpaService VALUES (96076,'Hot Stone Massage',    60);
INSERT INTO SpaService VALUES (96077,'Aromatherapy Massage', 60);
INSERT INTO SpaService VALUES (96078,'Facial Treatment',     45);
INSERT INTO SpaService VALUES (96079,'Swedish Massage',      75);
INSERT INTO SpaService VALUES (96080,'Deep Tissue Massage',  90);

-- ============================================================
-- ShuttleService  (40 rows)
-- NOTE: 'ATT Stadium' used instead of 'AT&T Stadium' to avoid
-- SQL*Plus substitution variable prompt triggered by the & character.
-- ============================================================
INSERT INTO ShuttleService VALUES (96081,'2025-09-05 11:30:00','2025-09-05 12:15:00','DFW Airport',       'Hotel',1);
INSERT INTO ShuttleService VALUES (96082,'2025-09-09 08:30:00','2025-09-09 09:15:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96083,'2025-09-15 09:30:00','2025-09-15 10:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96084,'2025-09-17 10:00:00','2025-09-17 10:45:00','Hotel',             'ATT Stadium',2);
INSERT INTO ShuttleService VALUES (96085,'2025-09-23 08:00:00','2025-09-23 08:45:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96086,'2025-09-27 10:30:00','2025-09-27 11:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96087,'2025-09-27 08:30:00','2025-09-27 09:15:00','Hotel',             'Globe Life Field',3);
INSERT INTO ShuttleService VALUES (96088,'2025-09-30 09:00:00','2025-09-30 09:45:00','Hotel',             'ATT Stadium',3);
INSERT INTO ShuttleService VALUES (96089,'2025-10-05 07:30:00','2025-10-05 08:15:00','Hotel',             'DFW Airport',2);
INSERT INTO ShuttleService VALUES (96090,'2025-10-06 09:00:00','2025-10-06 09:45:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96091,'2025-10-10 07:30:00','2025-10-10 08:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96092,'2025-10-14 09:30:00','2025-10-14 10:15:00','Hotel',             'Six Flags Over Texas',4);
INSERT INTO ShuttleService VALUES (96093,'2025-10-17 08:30:00','2025-10-17 09:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96094,'2025-10-19 10:00:00','2025-10-19 10:45:00','Hotel',             'ATT Stadium',2);
INSERT INTO ShuttleService VALUES (96095,'2025-10-21 08:00:00','2025-10-21 08:45:00','Hotel',             'Globe Life Field',2);
INSERT INTO ShuttleService VALUES (96096,'2025-10-25 08:30:00','2025-10-25 09:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96097,'2025-10-26 09:30:00','2025-10-26 10:15:00','Hotel',             'Six Flags Over Texas',1);
INSERT INTO ShuttleService VALUES (96098,'2025-10-30 08:30:00','2025-10-30 09:15:00','Hotel',             'Globe Life Field',3);
INSERT INTO ShuttleService VALUES (96099,'2025-10-31 08:00:00','2025-10-31 08:45:00','Hotel',             'DFW Airport',2);
INSERT INTO ShuttleService VALUES (96100,'2025-11-02 09:30:00','2025-11-02 10:15:00','Hotel',             'ATT Stadium',2);
INSERT INTO ShuttleService VALUES (96101,'2025-11-04 09:30:00','2025-11-04 10:00:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96102,'2025-11-07 09:00:00','2025-11-07 09:45:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96103,'2025-11-08 07:30:00','2025-11-08 08:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96104,'2025-11-11 07:30:00','2025-11-11 08:30:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96105,'2025-11-12 09:00:00','2025-11-12 09:45:00','Hotel',             'Globe Life Field',1);
INSERT INTO ShuttleService VALUES (96106,'2025-11-16 09:30:00','2025-11-16 10:15:00','Hotel',             'DFW Airport',3);
INSERT INTO ShuttleService VALUES (96107,'2025-11-17 09:00:00','2025-11-17 09:45:00','Hotel',             'DFW Airport',2);
INSERT INTO ShuttleService VALUES (96108,'2025-11-19 08:00:00','2025-11-19 08:45:00','Hotel',             'ATT Stadium',1);
INSERT INTO ShuttleService VALUES (96109,'2025-11-20 09:30:00','2025-11-20 10:00:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96110,'2025-11-23 08:00:00','2025-11-23 09:00:00','Hotel',             'ATT Stadium',3);
INSERT INTO ShuttleService VALUES (96111,'2025-11-25 08:30:00','2025-11-25 09:15:00','Hotel',             'DFW Airport',2);
INSERT INTO ShuttleService VALUES (96112,'2025-12-05 09:30:00','2025-12-05 10:15:00','Hotel',             'Six Flags Over Texas',1);
INSERT INTO ShuttleService VALUES (96113,'2026-01-14 09:00:00','2026-01-14 09:45:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96114,'2026-02-19 09:30:00','2026-02-19 10:15:00','Hotel',             'Globe Life Field',2);
INSERT INTO ShuttleService VALUES (96115,'2026-01-09 08:00:00','2026-01-09 08:45:00','Hotel',             'ATT Stadium',3);
INSERT INTO ShuttleService VALUES (96116,'2026-01-24 08:30:00','2026-01-24 09:15:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96117,'2026-02-05 10:00:00','2026-02-05 10:45:00','DFW Airport',       'Hotel',1);
INSERT INTO ShuttleService VALUES (96118,'2026-02-14 08:30:00','2026-02-14 09:15:00','Hotel',             'DFW Airport',1);
INSERT INTO ShuttleService VALUES (96119,'2026-03-05 08:00:00','2026-03-05 08:45:00','Hotel',             'Six Flags Over Texas',2);
INSERT INTO ShuttleService VALUES (96120,'2026-03-14 09:30:00','2026-03-14 10:15:00','Hotel',             'ATT Stadium',2);

-- ============================================================
-- Feedback  (50 rows | FeedbackID: 97001-97050)
-- ============================================================
INSERT INTO Feedback VALUES (97001,95001,5,4,5,5,'Excellent stay, very professional staff',  '2025-09-06');
INSERT INTO Feedback VALUES (97002,95002,4,3,4,4,'Room clean, breakfast could be better',    '2025-09-07');
INSERT INTO Feedback VALUES (97003,95003,5,5,5,5,'Absolutely perfect trip!',                 '2025-09-11');
INSERT INTO Feedback VALUES (97004,95004,3,3,4,3,'Decent stay, nothing special',             '2025-09-10');
INSERT INTO Feedback VALUES (97005,95005,5,4,5,5,'Loved the balcony view',                  '2025-09-15');
INSERT INTO Feedback VALUES (97006,95006,4,4,4,4,'Good experience overall',                 '2025-09-16');
INSERT INTO Feedback VALUES (97007,95007,4,3,5,4,'Room great, breakfast average',           '2025-09-18');
INSERT INTO Feedback VALUES (97008,95008,5,5,5,5,'Spa was fantastic',                       '2025-09-21');
INSERT INTO Feedback VALUES (97009,95009,5,4,5,5,'Beautiful room and great service',        '2025-09-22');
INSERT INTO Feedback VALUES (97010,95010,3,4,3,3,'Average stay, room service slow',         '2025-09-24');
INSERT INTO Feedback VALUES (97011,95011,5,5,5,5,'Outstanding from start to finish',        '2025-09-28');
INSERT INTO Feedback VALUES (97012,95012,4,3,4,4,'Clean room, friendly staff',              '2025-09-28');
INSERT INTO Feedback VALUES (97013,95013,4,4,4,5,'Great customer service',                  '2025-10-01');
INSERT INTO Feedback VALUES (97014,95014,5,4,5,5,'Spa and dinner were top notch',           '2025-10-03');
INSERT INTO Feedback VALUES (97015,95015,5,5,5,5,'Perfect business trip accommodation',     '2025-10-06');
INSERT INTO Feedback VALUES (97016,95016,3,3,3,3,'Room was small for the price',            '2025-10-07');
INSERT INTO Feedback VALUES (97017,95017,4,4,5,4,'Very comfortable bed',                   '2025-10-10');
INSERT INTO Feedback VALUES (97018,95018,4,3,4,4,'Good value for money',                   '2025-10-11');
INSERT INTO Feedback VALUES (97019,95019,5,5,5,5,'Best hotel experience ever',              '2025-10-15');
INSERT INTO Feedback VALUES (97020,95020,4,4,4,4,'Would recommend to friends',              '2025-10-15');
INSERT INTO Feedback VALUES (97021,95021,5,5,5,5,'Amazing honeymoon experience',            '2025-10-18');
INSERT INTO Feedback VALUES (97022,95022,4,4,4,5,'Excellent business facilities',           '2025-10-20');
INSERT INTO Feedback VALUES (97023,95023,3,3,4,4,'Room service took 45 minutes',           '2025-10-22');
INSERT INTO Feedback VALUES (97024,95024,4,3,4,3,'Good but breakfast could improve',        '2025-10-23');
INSERT INTO Feedback VALUES (97025,95025,5,4,5,5,'Great late checkout accommodation',       '2025-10-26');
INSERT INTO Feedback VALUES (97026,95026,3,4,4,3,'Average experience',                     '2025-10-27');
INSERT INTO Feedback VALUES (97027,95027,5,5,5,5,'Butler service was extraordinary',        '2025-10-31');
INSERT INTO Feedback VALUES (97028,95028,4,4,5,4,'Very clean and modern rooms',             '2025-11-01');
INSERT INTO Feedback VALUES (97029,95029,5,4,5,5,'Loved the early check-in option',         '2025-11-03');
INSERT INTO Feedback VALUES (97030,95030,4,3,4,4,'Nice stay, quiet environment',            '2025-11-05');
INSERT INTO Feedback VALUES (97031,95031,5,5,5,5,'Corner room view was spectacular',        '2025-11-08');
INSERT INTO Feedback VALUES (97032,95032,3,3,4,3,'Shower had low pressure',                '2025-11-09');
INSERT INTO Feedback VALUES (97033,95033,4,4,5,4,'Gym access was a great perk',             '2025-11-12');
INSERT INTO Feedback VALUES (97034,95034,4,3,4,4,'Solid stay overall',                     '2025-11-13');
INSERT INTO Feedback VALUES (97035,95035,5,5,5,5,'Simply flawless experience',              '2025-11-17');
INSERT INTO Feedback VALUES (97036,95036,4,4,4,5,'Very attentive concierge',               '2025-11-18');
INSERT INTO Feedback VALUES (97037,95037,4,4,4,4,'Nice view, comfy bed',                   '2025-11-20');
INSERT INTO Feedback VALUES (97038,95038,3,4,4,3,'A bit noisy on our floor',               '2025-11-21');
INSERT INTO Feedback VALUES (97039,95039,5,5,5,5,'Extra bed was perfect for family',        '2025-11-24');
INSERT INTO Feedback VALUES (97040,95040,4,4,5,4,'Great amenities throughout',              '2025-11-26');
INSERT INTO Feedback VALUES (97041,95041,5,4,5,5,'Second stay just as good',               '2025-12-06');
INSERT INTO Feedback VALUES (97042,95042,4,4,4,5,'Third stay - still impressed',            '2026-01-15');
INSERT INTO Feedback VALUES (97043,95043,5,5,5,5,'Anniversary stay was perfect',            '2026-02-20');
INSERT INTO Feedback VALUES (97044,95044,5,5,5,5,'Perfect for corporate meetings',          '2026-01-10');
INSERT INTO Feedback VALUES (97045,95045,4,4,5,4,'Great stay for a conference',             '2026-01-25');
INSERT INTO Feedback VALUES (97046,95046,5,4,5,5,'Confirmed stay exceeded expectations',    '2026-02-06');
INSERT INTO Feedback VALUES (97047,95047,4,3,4,4,'Good stay, spa was relaxing',             '2026-02-15');
INSERT INTO Feedback VALUES (97048,95003,4,4,5,4,'Follow-up: wanted to add more praise',    '2025-09-12');
INSERT INTO Feedback VALUES (97049,95011,5,4,5,5,'Forgot to mention the amazing spa',       '2025-09-29');
INSERT INTO Feedback VALUES (97050,95019,5,5,5,5,'Still raving about this stay',            '2025-10-20');


-- DATA FROM projectDBupdate.sql
-- ============================================================
-- Hotel Database Management System
-- DML UPDATE Script — projectDBupdate.sql
-- Section: 008  |  Team: 13  |  Spring 2026
-- Prefix: 
-- Run AFTER projectDBinsert.sql; re-run queries to compare results.
-- ============================================================

-- ============================================================
-- SECTION 1: NEW GUESTS, MEMBERSHIPS, PAYMENT INFO
-- Effect: increases guest count, changes age-group distribution
-- ============================================================
INSERT INTO Guest VALUES (91051,'Alex',  'Morgan', '2002-05-15','817-900-0151','alex.morgan@hms.com');
INSERT INTO Guest VALUES (91052,'Priya', 'Patel',  '1999-11-03','817-900-0152','priya.patel@hms.com');
INSERT INTO Guest VALUES (91053,'Chris', 'Zhang',  '1975-08-20','817-900-0153','chris.zhang@hms.com');

INSERT INTO Membership VALUES (92051,91051,'Bronze', 'Deluxe',    'Nearby Attractions');
INSERT INTO Membership VALUES (92052,91052,'Silver', 'Queen',     'Leisure');
INSERT INTO Membership VALUES (92053,91053,'Gold',   'King',      'Business');

INSERT INTO PaymentInfo VALUES (93051,91051,'Cash',       NULL,   '100 New St, Arlington TX');
INSERT INTO PaymentInfo VALUES (93052,91052,'MasterCard', '7890', '200 New Ave, Irving TX');
INSERT INTO PaymentInfo VALUES (93053,91053,'Visa',       '4321', '300 New Blvd, Dallas TX');

-- ============================================================
-- SECTION 2: NEW RESERVATIONS
-- Effect: changes occupancy, payment mode distribution,
--         check-in time spread, room type popularity
-- ============================================================
INSERT INTO Reservation VALUES (95051,91051,90210,'2026-03-15','09:00','2026-03-18',  495.00,'Confirmed','Wheelchair accessible','Cash');
INSERT INTO Reservation VALUES (95052,91052,90309,'2026-03-16','22:00','2026-03-20',  860.00,'Confirmed',NULL,                   'Debit Card');
INSERT INTO Reservation VALUES (95053,91053,90404,'2026-03-17','14:00','2026-03-21', 1240.00,'Confirmed','Extra towels',          'Credit Card');
-- Guest 91001 gets 4th reservation in 2026 -> changes loyalty query
INSERT INTO Reservation VALUES (95054,91001,90504,'2026-03-20','14:00','2026-03-24', 1300.00,'Confirmed',NULL,                   'Credit Card');
-- Guest 91003 gets 4th reservation in 2026
INSERT INTO Reservation VALUES (95055,91003,90405,'2026-03-22','14:00','2026-03-26',  900.00,'Confirmed',NULL,                   'Credit Card');

INSERT INTO ReservationGuest VALUES (95051,91051);
INSERT INTO ReservationGuest VALUES (95052,91052);
INSERT INTO ReservationGuest VALUES (95053,91053);
INSERT INTO ReservationGuest VALUES (95054,91001);
INSERT INTO ReservationGuest VALUES (95055,91003);

-- ============================================================
-- SECTION 3: NEW SERVICES AND SUBTYPE ROWS
-- Effect: increases shuttle/spa revenue totals, changes destination ranking
-- ============================================================
INSERT INTO Service VALUES (96121,95051,'Shuttle',    '2026-03-18 10:00:00','Completed', 40.00,94029);
INSERT INTO Service VALUES (96122,95052,'Spa',        '2026-03-17 11:00:00','Completed',120.00,94038);
INSERT INTO Service VALUES (96123,95053,'Room Service','2026-03-18 20:00:00','Completed', 58.00,94005);
INSERT INTO Service VALUES (96124,95054,'Shuttle',    '2026-03-24 09:00:00','Completed', 40.00,94008);
INSERT INTO Service VALUES (96125,95055,'Spa',        '2026-03-26 11:00:00','Completed',130.00,94007);

INSERT INTO ShuttleService VALUES (96121,'2026-03-18 10:30:00','2026-03-18 11:15:00','Hotel','Six Flags Over Texas',1);
INSERT INTO SpaService     VALUES (96122,'Hot Stone Massage',60);
INSERT INTO RoomService    VALUES (96123,90404,'Dinner - pasta and wine');
INSERT INTO ShuttleService VALUES (96124,'2026-03-24 09:30:00','2026-03-24 10:15:00','Hotel','DFW Airport',2);
INSERT INTO SpaService     VALUES (96125,'Deep Tissue Massage',90);

-- ============================================================
-- SECTION 4: STATUS UPDATES
-- Effect: changes room availability, affects occupancy analysis
-- ============================================================
UPDATE Reservation
SET ReservStatus = 'Confirmed'
WHERE ReservationID IN (95048, 95049, 95050);

UPDATE Reservation
SET ReservStatus = 'Completed'
WHERE ReservationID = 95043;

UPDATE Reservation
SET ReservStatus = 'Cancelled'
WHERE ReservationID = 95046;

-- ============================================================
-- SECTION 5: EMPLOYEE UPDATES
-- Effect: changes salary distribution
-- ============================================================
UPDATE Employee SET Salary = 65000.00, HoursWorked = 175 WHERE EmployeeID = 94007;
UPDATE Employee SET Salary = 58000.00                     WHERE EmployeeID = 94012;
UPDATE Employee SET HoursWorked = 168                     WHERE EmployeeID = 94039;

-- ============================================================
-- SECTION 6: ROOM RATE UPDATES
-- ============================================================
UPDATE Room SET RatePerNight = 275.00 WHERE RoomNumber = 90101;
UPDATE Room SET RatePerNight = 420.00 WHERE RoomNumber = 90503;

-- ============================================================
-- SECTION 7: NEW FEEDBACK
-- Effect: changes average ratings; alters rating report results
-- ============================================================
INSERT INTO Feedback VALUES (97051,95051,4,4,5,4,'Great accessible room, very convenient', '2026-03-19');
INSERT INTO Feedback VALUES (97052,95053,5,5,5,5,'Exceptional stay for business',          '2026-03-22');
INSERT INTO Feedback VALUES (97053,95054,5,4,5,5,'Fourth stay and still very impressed',   '2026-03-25');
INSERT INTO Feedback VALUES (97054,95055,4,4,5,4,'Another great stay for work travel',     '2026-03-27');

-- ============================================================
-- SECTION 8: DELETES — cleanup
-- ============================================================
-- Remove feedback for the cancelled reservation
DELETE FROM Feedback
WHERE ReservationID = 95046;

-- Remove a payment record for cleanup demo
DELETE FROM PaymentInfo
WHERE PaymentID = 93050;


